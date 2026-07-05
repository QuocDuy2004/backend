# -*- coding: utf-8 -*-

import json
import os
import random
import re
import sys
import time
from datetime import datetime
from decimal import Decimal, InvalidOperation

import gspread
import requests
from google.oauth2.service_account import Credentials
from gspread.exceptions import APIError


API_URL = os.getenv("SMMKAY_API_URL", "https://smmkay.com/api/adminv1")
API_KEY = os.getenv("SMMKAY_API_KEY", "37420810974b3ad84d2b7392a57ef498")
SERVICE_ID = os.getenv("SMMKAY_SERVICE_ID", "1944")
LIST_ORDER_ACTION = os.getenv("SMMKAY_LIST_ORDER_ACTION", "listOrders")

SMMCODER_API_URL = os.getenv("SMMCODER_API_URL", "https://belike.vn/api/v2")
SMMCODER_API_KEY = os.getenv("SMMCODER_API_KEY", "d02be0a71767ab99c9ea4b9be7575e86")
SMMCODER_SERVICE_ID = os.getenv("SMMCODER_SERVICE_ID", "3096")
SMMCODER_BATCH_LIMIT = int(os.getenv("SMMCODER_BATCH_LIMIT", "5"))
SMMCODER_MAX_RATE = Decimal(os.getenv("SMMCODER_MAX_RATE", "0.2"))
SMMCODER_RATE_CACHE_SECONDS = int(os.getenv("SMMCODER_RATE_CACHE_SECONDS", "300"))

SERVICE_ACCOUNT_FILE = os.getenv(
    "GOOGLE_SERVICE_ACCOUNT_FILE",
    "reg-log-153f9-5400aec13cba.json",
)
SPREADSHEET_ID = os.getenv(
    "GOOGLE_SPREADSHEET_ID",
    "1kKL6baUE0ME-GPSuNd8KVZuDY8c_RYvqoK1GVP2x7a0",
)
SHEET_GID = int(os.getenv("GOOGLE_SHEET_GID", "0"))

CHECK_NEW_ORDER_INTERVAL = int(os.getenv("CHECK_NEW_ORDER_INTERVAL", "10"))
CHECK_PROGRESS_INTERVAL = int(os.getenv("CHECK_PROGRESS_INTERVAL", "120"))

PROXY_KEY_FILE = os.getenv("PROXY_KEY_FILE", "proxy.txt")
PROXY_API_URL = os.getenv("PROXY_API_URL", "https://proxyxoay.shop/api/get.php")
PROXY_FIRST_TTL_SECONDS = int(os.getenv("PROXY_FIRST_TTL_SECONDS", "180"))
PROXY_ROTATE_SECONDS = int(os.getenv("PROXY_ROTATE_SECONDS", "60"))
SHARE_RESPONSE_FILE = os.getenv("SHARE_RESPONSE_FILE", "response")

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

SHEET_HEADERS = [
    "ID",
    "OrderIdSmm",
    "Link",
    "Quantity",
    "StartCount",
    "Status",
    "Time",
    "Response",
]
COLUMN = {name: index + 1 for index, name in enumerate(SHEET_HEADERS)}
COMPLETED_STATUS_ALIASES = {"completed", "done"}
CANCELED_STATUS_ALIASES = {"cancel", "canceled", "cancelled","Cancelled"}
ACTIVE_STATUS_ALIASES = {"pending", "in progress", "inprogress", "processing"}

REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0 Safari/537.36",
    "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
    "Cache-Control": "max-age=0",
    "Dpr": "1",
    "Priority": "u=0, i",
    "Sec-Ch-Prefers-Color-Scheme": "light",
    "Sec-Ch-Ua": '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"',
    "Sec-Ch-Ua-Full-Version-List": '"Not;A=Brand";v="8.0.0.0", "Chromium";v="150.0.7871.46", "Google Chrome";v="150.0.7871.46"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Model": '""',
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Ch-Ua-Platform-Version": '"7.0.0"',
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Upgrade-Insecure-Requests": "1",
    "Viewport-Width": "889",
}

PROXY_STATE = {
    "key": None,
    "enabled": True,
    "proxy": None,
    "created_at": 0,
    "last_fetch_at": 0,
    "fetch_count": 0,
}

SMMCODER_RATE_STATE = {
    "checked_at": 0,
    "rate": None,
    "service": None,
    "error": "",
}


def configure_stdout():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except AttributeError:
        pass


def load_proxy_key():
    try:
        with open(PROXY_KEY_FILE, "r", encoding="utf-8") as file:
            return file.read().strip()
    except FileNotFoundError:
        return ""


def normalize_proxy_address(proxy_value):
    proxy_value = str(proxy_value or "").strip().strip(":")
    if not proxy_value:
        return ""

    parts = [part for part in proxy_value.split(":") if part]
    if len(parts) < 2:
        return ""

    return f"{parts[0]}:{parts[1]}"


def fetch_rotating_proxy():
    key = PROXY_STATE.get("key")
    if not key or not PROXY_STATE.get("enabled"):
        return None

    try:
        response = requests.get(
            PROXY_API_URL,
            params={
                "key": key,
                "nhamang": "random",
                "tinhthanh": "0",
                "whitelist": "",
            },
            timeout=20,
        )
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        print(f"ERROR get proxy: {exc}")
        return None

    if data.get("status") == 102:
        PROXY_STATE["enabled"] = False
        print("Proxy disabled: key khong ton tai.")
        return None

    if data.get("status") != 100:
        print(f"Proxy API skipped: {data}")
        return None

    proxy_address = normalize_proxy_address(data.get("proxyhttp"))
    if not proxy_address:
        print(f"Proxy API missing proxyhttp: {data}")
        return None

    print(
        "Using proxy "
        f"{proxy_address} ip={data.get('ip', '')} "
        f"location={data.get('Vi Tri', '')}"
    )
    return proxy_address


def get_share_count_proxies():
    now = time.time()

    if PROXY_STATE["key"] is None:
        PROXY_STATE["key"] = load_proxy_key()
        if not PROXY_STATE["key"]:
            PROXY_STATE["enabled"] = False
            print("Proxy disabled: proxy.txt is empty or missing.")

    if not PROXY_STATE.get("enabled"):
        return None

    current_proxy = PROXY_STATE.get("proxy")
    current_age = now - PROXY_STATE.get("created_at", 0)
    required_age = (
        PROXY_FIRST_TTL_SECONDS
        if PROXY_STATE.get("fetch_count", 0) <= 1
        else PROXY_ROTATE_SECONDS
    )

    if current_proxy and current_age < required_age:
        proxy_url = f"http://{current_proxy}"
        return {"http": proxy_url, "https": proxy_url}

    if now - PROXY_STATE.get("last_fetch_at", 0) < PROXY_ROTATE_SECONDS:
        if current_proxy:
            proxy_url = f"http://{current_proxy}"
            return {"http": proxy_url, "https": proxy_url}
        return None

    proxy_address = fetch_rotating_proxy()
    PROXY_STATE["last_fetch_at"] = now

    if not proxy_address:
        return None

    PROXY_STATE["proxy"] = proxy_address
    PROXY_STATE["created_at"] = now
    PROXY_STATE["fetch_count"] = PROXY_STATE.get("fetch_count", 0) + 1
    proxy_url = f"http://{proxy_address}"
    return {"http": proxy_url, "https": proxy_url}


def show_config_error(exc_type, exc, traceback):
    if exc_type in (FileNotFoundError, PermissionError, ValueError):
        print(f"ERROR: {exc}")
        return

    if exc_type is APIError:
        status_code = getattr(getattr(exc, "response", None), "status_code", None)
        if status_code == 403:
            print(
                "ERROR: Google Sheet rejected write permission. Share the Sheet "
                "with sheet-api@reg-log-153f9.iam.gserviceaccount.com as Editor."
            )
            return

    sys.__excepthook__(exc_type, exc, traceback)


sys.excepthook = show_config_error


def now_text():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def to_int(value, default=0):
    try:
        if value is None or value == "":
            return default
        return int(float(str(value).strip().replace(",", "")))
    except (TypeError, ValueError):
        return default


def is_number_uid(value):
    return str(value).strip().isdigit()


def normalize_status(status):
    value = str(status or "").strip()
    normalized = value.lower()
    if normalized in COMPLETED_STATUS_ALIASES:
        return "Completed"
    if normalized in CANCELED_STATUS_ALIASES:
        return "Canceled"
    if normalized in {"in progress", "inprogress", "processing"}:
        return "In progress"
    if normalized == "pending":
        return "Pending"
    return value or "Pending"


def is_sheet_completed_status(status):
    return str(status or "").strip().lower() in COMPLETED_STATUS_ALIASES


def is_sheet_canceled_status(status):
    return str(status or "").strip().lower() in CANCELED_STATUS_ALIASES


def is_pending_status(status):
    return normalize_status(status) == "Pending"


def normalize_uid(value):
    value = str(value or "").strip()
    if not value:
        return ""

    scientific_match = re.fullmatch(r"(\d+(?:[.,]\d+)?)E\+(\d+)", value, re.IGNORECASE)
    if scientific_match:
        number = scientific_match.group(1).replace(",", ".")
        exponent = int(scientific_match.group(2))
        digits = number.replace(".", "")
        decimals = len(number.split(".", 1)[1]) if "." in number else 0
        zeros = exponent - decimals
        if zeros >= 0:
            return digits + ("0" * zeros)

    return value


def is_completed_status(status):
    return normalize_status(status) == "Completed"


def is_canceled_status(status):
    return normalize_status(status) == "Canceled"


def is_terminal_status(status):
    return normalize_status(status) in {"Completed", "Canceled"}


def load_service_account_info():
    try:
        with open(SERVICE_ACCOUNT_FILE, "r", encoding="utf-8") as file:
            info = json.load(file)
    except FileNotFoundError as exc:
        raise FileNotFoundError(
            f"Missing service account file: {SERVICE_ACCOUNT_FILE}"
        ) from exc

    private_key = str(info.get("private_key", ""))
    if "\\n" in private_key and "\n" not in private_key:
        private_key = private_key.replace("\\n", "\n")
        info["private_key"] = private_key

    if (
        not private_key.startswith("-----BEGIN PRIVATE KEY-----")
        or not private_key.rstrip().endswith("-----END PRIVATE KEY-----")
        or len(private_key) < 100
    ):
        raise ValueError(
            "Service account JSON has a missing or invalid private_key. "
            "Download a full JSON key from Google Cloud IAM and replace "
            f"{SERVICE_ACCOUNT_FILE}."
        )

    return info


def connect_sheet():
    service_account_info = load_service_account_info()
    creds = Credentials.from_service_account_info(
        service_account_info,
        scopes=SCOPES,
    )
    client = gspread.authorize(creds)
    service_account_email = service_account_info.get("client_email", "the service account")

    try:
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
    except PermissionError as exc:
        raise PermissionError(
            "Google Sheet permission denied. Share this spreadsheet as Editor "
            f"with {service_account_email}: "
            f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit?gid={SHEET_GID}"
        ) from exc

    for worksheet in spreadsheet.worksheets():
        if worksheet.id == SHEET_GID:
            return worksheet

    raise ValueError(f"Could not find worksheet gid={SHEET_GID}")


def normalize_sheet_layout(ws):
    first_row = ws.row_values(1)
    ws.format("A:B", {"numberFormat": {"type": "TEXT"}})

    if not first_row:
        ws.append_row(SHEET_HEADERS, value_input_option="RAW")
        print("Created Google Sheet header.")
        return

    if first_row[: len(SHEET_HEADERS)] == SHEET_HEADERS and len(first_row) <= len(SHEET_HEADERS):
        return

    old_seven_column_layout = first_row[:7] == [
        "ID",
        "UID",
        "Link",
        "Quantity",
        "StartCount",
        "Time",
        "Status",
    ]

    if old_seven_column_layout:
        rows = ws.get_all_values()
        migrated = [SHEET_HEADERS]

        for row in rows[1:]:
            padded = row + [""] * 7
            migrated.append(
                [
                    padded[0],
                    "",
                    padded[2],
                    padded[3],
                    padded[4],
                    normalize_status(padded[6]),
                    padded[5],
                    "",
                ]
            )

        ws.clear()
        ws.format("A:B", {"numberFormat": {"type": "TEXT"}})
        ws.update("A1", migrated, value_input_option="RAW")
        print("Migrated 7-column Sheet layout to ID OrderIdSmm Link Quantity StartCount Status Time Response.")
        return

    old_target_layout = first_row[:8] == [
        "ID",
        "UID",
        "Link",
        "Quantity",
        "Target",
        "Time",
        "Status",
        "StartCount",
    ]

    if old_target_layout:
        rows = ws.get_all_values()
        migrated = [SHEET_HEADERS]

        for row in rows[1:]:
            padded = row + [""] * 8
            migrated.append(
                [
                    padded[0],
                    "",
                    padded[2],
                    padded[3],
                    padded[7],
                    padded[6],
                    padded[5],
                    "",
                ]
            )

        ws.clear()
        ws.format("A:B", {"numberFormat": {"type": "TEXT"}})
        ws.update("A1", migrated, value_input_option="RAW")
        print("Migrated old Sheet layout to ID OrderIdSmm Link Quantity StartCount Status Time Response.")
        return

    ws.update("A1:H1", [SHEET_HEADERS], value_input_option="RAW")
    print("Updated Google Sheet header.")


def get_sheet_rows(ws):
    rows = ws.get_all_values()
    result = []

    for row_index, row in enumerate(rows[1:], start=2):
        padded = row + [""] * len(SHEET_HEADERS)
        result.append(
            {
                "row_index": row_index,
                "id": padded[0].strip(),
                "order_id_smm": normalize_uid(padded[1]),
                "link": padded[2].strip(),
                "quantity": to_int(padded[3]),
                "start_count": to_int(padded[4], default=None),
                "raw_status": padded[5].strip(),
                "status": padded[5].strip() or "Pending",
                "time": padded[6].strip(),
                "response": padded[7].strip(),
            }
        )

    return [row for row in result if row["id"]]


def get_sheet_ids(ws):
    return {str(row["id"]) for row in get_sheet_rows(ws)}


def normalize_existing_id_cells(ws):
    rows = ws.get_all_values()
    updates = []

    for row_index, row in enumerate(rows[1:], start=2):
        for column_name in ("ID", "OrderIdSmm"):
            if len(row) < COLUMN[column_name]:
                continue

            value = row[COLUMN[column_name] - 1].strip()
            normalized = normalize_uid(value)
            if normalized and normalized != value:
                updates.append(
                    {
                        "range": gspread.utils.rowcol_to_a1(row_index, COLUMN[column_name]),
                        "values": [[normalized]],
                    }
                )

    if updates:
        ws.batch_update(updates, value_input_option="RAW")
        print(f"Normalized {len(updates)} existing ID cell(s).")


def update_sheet_order(ws, row_index, **changes):
    updates = []
    for field, value in changes.items():
        column_name = {
            "id": "ID",
            "order_id_smm": "OrderIdSmm",
            "link": "Link",
            "quantity": "Quantity",
            "start_count": "StartCount",
            "status": "Status",
            "time": "Time",
            "response": "Response",
        }.get(field)
        if not column_name:
            continue
        if field in {"id", "order_id_smm"}:
            value = normalize_uid(value)
        updates.append(
            {
                "range": gspread.utils.rowcol_to_a1(row_index, COLUMN[column_name]),
                "values": [[value]],
            }
        )

    if updates:
        ws.batch_update(updates, value_input_option="RAW")


def append_sheet_order(ws, order):
    ws.append_row(
        [
            order["id"],
            normalize_uid(order.get("order_id_smm", "")),
            order["link"],
            order["quantity"],
            order.get("start_count", ""),
            str(order.get("status") or "Pending").strip() or "Pending",
            order["time"],
            order.get("response", ""),
        ],
        value_input_option="RAW",
    )


def get_pending_orders():
    payload = {
        "key": API_KEY,
        "action": LIST_ORDER_ACTION,
        "service": SERVICE_ID,
        "status": "Pending",
    }

    response = requests.post(API_URL, data=payload, timeout=30)
    response.raise_for_status()
    data = response.json()

    orders = parse_order_list_response(data)

    if not orders and LIST_ORDER_ACTION != "listOrder":
        payload["action"] = "listOrder"
        response = requests.post(API_URL, data=payload, timeout=30)
        response.raise_for_status()
        data = response.json()
        orders = parse_order_list_response(data)

    return orders


def parse_order_list_response(data):
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        if isinstance(data.get("data"), list):
            return data["data"]
        if isinstance(data.get("orders"), list):
            return data["orders"]
    return []


def set_order_status(order_id, status):
    payload = {
        "key": API_KEY,
        "action": "setStatus",
        "id": order_id,
        "status": status,
    }

    try:
        response = requests.post(API_URL, data=payload, timeout=30)
        response.raise_for_status()
        print(f"setStatus order {order_id} => {status}: {response.text}")
        return True
    except Exception as exc:
        print(f"ERROR setStatus order {order_id}: {exc}")
        return False


def set_start_count(order_id, start_count):
    payload = {
        "key": API_KEY,
        "action": "setStartCount",
        "id": order_id,
        "start_count": start_count,
    }

    try:
        response = requests.post(API_URL, data=payload, timeout=30)
        response.raise_for_status()
        print(f"setStartCount order {order_id} => {start_count}: {response.text}")
        return True
    except Exception as exc:
        print(f"ERROR setStartCount order {order_id}: {exc}")
        return False


def to_decimal(value, default=None):
    try:
        text = str(value or "").strip().replace(",", ".")
        if not text:
            return default
        return Decimal(text)
    except (InvalidOperation, ValueError):
        return default


def smmcoder_get_service_rate(force=False):
    now = time.time()
    cached_rate = SMMCODER_RATE_STATE.get("rate")
    cache_age = now - SMMCODER_RATE_STATE.get("checked_at", 0)

    if (
        not force
        and cached_rate is not None
        and cache_age < SMMCODER_RATE_CACHE_SECONDS
    ):
        return cached_rate, SMMCODER_RATE_STATE.get("service"), ""

    payload = {
        "key": SMMCODER_API_KEY,
        "action": "services",
    }

    try:
        response = requests.post(SMMCODER_API_URL, data=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
    except Exception as exc:
        error = f"ERROR SMMGen services rate check: {exc}"
        SMMCODER_RATE_STATE.update(
            {"checked_at": now, "rate": None, "service": None, "error": error}
        )
        return None, None, error

    services = data if isinstance(data, list) else data.get("services") if isinstance(data, dict) else []
    if not isinstance(services, list):
        error = f"ERROR SMMGen services response is not a list: {data}"
        SMMCODER_RATE_STATE.update(
            {"checked_at": now, "rate": None, "service": None, "error": error}
        )
        return None, None, error

    service = next(
        (
            item
            for item in services
            if str(item.get("service", "")).strip() == str(SMMCODER_SERVICE_ID)
        ),
        None,
    )
    if not service:
        error = f"ERROR SMMGen service {SMMCODER_SERVICE_ID} not found in services list."
        SMMCODER_RATE_STATE.update(
            {"checked_at": now, "rate": None, "service": None, "error": error}
        )
        return None, None, error

    rate = to_decimal(service.get("rate"))
    if rate is None:
        error = f"ERROR SMMGen service {SMMCODER_SERVICE_ID} has invalid rate: {service.get('rate')}"
        SMMCODER_RATE_STATE.update(
            {"checked_at": now, "rate": None, "service": service, "error": error}
        )
        return None, service, error

    SMMCODER_RATE_STATE.update(
        {"checked_at": now, "rate": rate, "service": service, "error": ""}
    )
    return rate, service, ""


def smmcoder_add_order(link, quantity):
    payload = {
        "key": SMMCODER_API_KEY,
        "action": "add",
        "quantity": str(quantity),
        "link": link,
        "service": SMMCODER_SERVICE_ID,
    }

    try:
        response = requests.post(SMMCODER_API_URL, data=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data
    except Exception as exc:
        return {"error": str(exc)}


def smmcoder_get_statuses(order_ids):
    order_ids = [str(order_id).strip() for order_id in order_ids if str(order_id).strip()]
    if not order_ids:
        return {}

    payload = {
        "key": SMMCODER_API_KEY,
        "action": "status",
        "orders": ",".join(order_ids),
    }

    try:
        response = requests.post(SMMCODER_API_URL, data=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, dict) else {}
    except Exception as exc:
        print(f"ERROR smmcoder status: {exc}")
        return {}


def parse_reduced_count(text):
    if not text:
        return 0

    text = str(text).strip().upper().replace(" ", "")
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    else:
        text = text.replace(",", "")

    match = re.search(r"(\d+(?:\.\d+)?)([KM])?", text)
    if not match:
        return int(text) if text.isdigit() else 0

    num = float(match.group(1))
    unit = match.group(2)
    if unit == "K":
        num *= 1000
    elif unit == "M":
        num *= 1_000_000

    return int(num)


def extract_share_counts_from_html(html):
    share_counts = []
    searchable_html = str(html or "").replace('\\"', '"')

    bloks_counts = re.findall(
        r'\(bk\.action\.string\.Replace,\s*"[^"]*count[^"]*",\s*"[^"]*count[^"]*",\s*"([^"]+)",\s*true\)',
        searchable_html,
    )
    if bloks_counts:
        share_counts.extend(parse_reduced_count(item) for item in bloks_counts)

    feedback_share_counts = re.findall(
        r'"feedback"\s*:\s*\{.*?"share_count"\s*:\s*\{\s*"count"\s*:\s*(\d+)',
        searchable_html,
        re.DOTALL,
    )
    share_counts.extend(int(item) for item in feedback_share_counts)

    patterns = [
        r'"share_count"\s*:\s*\{\s*"count"\s*:\s*(\d+)',
        r'"i18n_share_count"\s*:\s*"([^"]+)"',
        r'"share_count_reduced"\s*:\s*"([^"]+)"',
    ]

    for pattern in patterns:
        for value in re.findall(pattern, searchable_html, re.DOTALL):
            count = int(value) if str(value).isdigit() else parse_reduced_count(value)
            share_counts.append(count)

    return [count for count in share_counts if count >= 0]


def get_share_count(full_url, max_retries=8):
    if not full_url:
        return None

    full_url = str(full_url).strip()
    if is_number_uid(full_url):
        return 0

    for attempt in range(1, max_retries + 1):
        try:
            headers = REQUEST_HEADERS.copy()
            headers["Referer"] = full_url

            response = requests.get(
                full_url,
                headers=headers,
                proxies=get_share_count_proxies(),
                timeout=15,
                allow_redirects=True,
            )
            response.raise_for_status()
            html = response.text
            if SHARE_RESPONSE_FILE:
                with open(SHARE_RESPONSE_FILE, "w", encoding="utf-8", errors="ignore") as file:
                    file.write(html)

            share_counts = extract_share_counts_from_html(html)

            if share_counts:
                return max(share_counts)

        except Exception as exc:
            print(f"ERROR get share count attempt {attempt}: {str(exc)[:120]}")

        if attempt < max_retries:
            time.sleep(random.uniform(2.0, 4.5))

    return None


def extract_api_order(api_order):
    order_id = str(api_order.get("id") or api_order.get("order") or "").strip()
    link = str(api_order.get("link") or api_order.get("url") or "").strip()
    quantity = to_int(api_order.get("quantity") or api_order.get("qty"))
    status = str(api_order.get("status") or "Pending").strip() or "Pending"

    if not order_id or not link:
        return None

    return {
        "id": order_id,
        "link": link,
        "quantity": quantity,
        "status": status,
    }


def sync_new_orders_to_sheet(ws):
    api_orders = get_pending_orders()
    sheet_ids = get_sheet_ids(ws)
    added = 0

    for raw_order in api_orders:
        if not isinstance(raw_order, dict):
            continue

        api_order = extract_api_order(raw_order)
        if not api_order:
            continue

        order_id = api_order["id"]
        if order_id in sheet_ids:
            print(f"Skip existing order {order_id}.")
            continue

        append_sheet_order(
            ws,
            {
                "id": order_id,
                "order_id_smm": "",
                "link": api_order["link"],
                "quantity": api_order["quantity"],
                "start_count": "",
                "time": now_text(),
                "status": normalize_status(api_order["status"]),
                "response": "",
            },
        )

        sheet_ids.add(order_id)
        added += 1
        print(f"Added order {order_id} to Google Sheet.")

    print(f"{LIST_ORDER_ACTION} sync done. Added {added} new order(s).")


def ensure_start_counts(ws):
    rows = get_sheet_rows(ws)
    updated = 0

    for row in rows:
        if not is_pending_status(row["status"]):
            print(
                f"Skip StartCount for order {row['id']}: "
                f"Status is {row['status'] or 'blank'}, not Pending."
            )
            continue

        if row["start_count"] is not None:
            continue

        start_count = get_share_count(row["link"])
        if start_count is None:
            print(f"Could not get StartCount for order {row['id']}.")
            continue

        set_start_count(row["id"], start_count)
        update_sheet_order(ws, row["row_index"], start_count=start_count)
        updated += 1
        print(f"Updated StartCount for order {row['id']}: {start_count}")

    if updated:
        print(f"StartCount sync done. Updated {updated} order(s).")


def send_pending_orders_to_smmcoder(ws):
    rows = get_sheet_rows(ws)
    pending_rows = [
        row
        for row in rows
        if is_pending_status(row["status"])
        and not row["order_id_smm"]
        and row["link"]
        and row["quantity"] > 0
    ][:SMMCODER_BATCH_LIMIT]

    if not pending_rows:
        print("No Pending order to send to SMMCoder.")
        return

    current_rate, service_info, rate_error = smmcoder_get_service_rate()
    if rate_error:
        response_text = json.dumps(
            {
                "error": rate_error,
                "service": SMMCODER_SERVICE_ID,
                "max_rate": str(SMMCODER_MAX_RATE),
            },
            ensure_ascii=False,
        )
        for row in pending_rows:
            update_sheet_order(
                ws,
                row["row_index"],
                status="Rate check error",
                response=response_text,
            )
        print(rate_error)
        print(f"Skipped {len(pending_rows)} Pending order(s) because SMMGen rate could not be verified.")
        return

    if current_rate > SMMCODER_MAX_RATE:
        response_text = json.dumps(
            {
                "error": "SMMGen service rate is above configured max rate; action=add skipped.",
                "service": SMMCODER_SERVICE_ID,
                "rate": str(current_rate),
                "max_rate": str(SMMCODER_MAX_RATE),
                "service_name": (service_info or {}).get("name", ""),
            },
            ensure_ascii=False,
        )
        for row in pending_rows:
            update_sheet_order(
                ws,
                row["row_index"],
                status="Rate blocked",
                response=response_text,
            )
        print(
            f"SMMGen service {SMMCODER_SERVICE_ID} rate {current_rate} "
            f"> max {SMMCODER_MAX_RATE}; skipped {len(pending_rows)} order(s)."
        )
        return

    print(
        f"SMMGen service {SMMCODER_SERVICE_ID} rate {current_rate} "
        f"<= max {SMMCODER_MAX_RATE}; sending {len(pending_rows)} order(s)."
    )

    for row in pending_rows:
        data = smmcoder_add_order(row["link"], row["quantity"])
        response_text = json.dumps(data, ensure_ascii=False)
        smm_order_id = normalize_uid(data.get("order", "")) if isinstance(data, dict) else ""

        if smm_order_id:
            update_sheet_order(
                ws,
                row["row_index"],
                order_id_smm=smm_order_id,
                status="In progress",
                response=response_text,
            )
            set_order_status(row["id"], "In progress")
            print(f"Sent order {row['id']} to SMMCoder => {smm_order_id}.")
        else:
            update_sheet_order(
                ws,
                row["row_index"],
                status="Submit error",
                response=response_text,
            )
            print(f"ERROR SMMCoder add order {row['id']}: {response_text}")


def check_smmcoder_statuses(ws):
    rows = get_sheet_rows(ws)
    tracking_rows = [
        row
        for row in rows
        if row["order_id_smm"]
        and not is_sheet_completed_status(row["status"])
        and not is_sheet_canceled_status(row["status"])
    ]

    if not tracking_rows:
        print("No SMMCoder order to check.")
        return

    for index in range(0, len(tracking_rows), 100):
        batch = tracking_rows[index : index + 100]
        statuses = smmcoder_get_statuses([row["order_id_smm"] for row in batch])

        for row in batch:
            smm_order_id = row["order_id_smm"]
            status_data = statuses.get(smm_order_id, {})
            if not isinstance(status_data, dict):
                continue

            smm_status = normalize_status(status_data.get("status"))
            if smm_status == "Completed":
                response_text = json.dumps(status_data, ensure_ascii=False)
                update_sheet_order(
                    ws,
                    row["row_index"],
                    status="Completed",
                    response=response_text,
                )
                set_order_status(row["id"], "Completed")
                print(f"SMMCoder order {smm_order_id} completed; updated SMMKay order {row['id']}.")


def sync_smmkay_statuses_from_sheet(rows):
    for row in rows:
        raw_status = row.get("raw_status", row["status"])
        status = normalize_status(raw_status)

        if status in {"Pending", ""}:
            continue

        set_order_status(row["id"], status)


def check_tracking_orders(ws):
    rows = get_sheet_rows(ws)
    if not rows:
        print("No orders in Google Sheet.")
        return

    sync_smmkay_statuses_from_sheet(rows)

    for row in rows:
        order_id = row["id"]

        if not is_pending_status(row["status"]):
            print(
                f"Skip share count for order {order_id}: "
                f"Status is {row['status'] or 'blank'}, not Pending."
            )
            continue

        current_share = get_share_count(row["link"])
        if current_share is None:
            print(f"Could not get share count for order {order_id}.")
            continue

        start_count = row["start_count"]
        if start_count is None:
            start_count = current_share
            set_start_count(order_id, start_count)
            update_sheet_order(ws, row["row_index"], start_count=start_count)
            print(f"Updated missing StartCount for order {order_id}: {start_count}")

        print(
            f"Order {order_id}: current={current_share}, "
            f"start={start_count}, quantity={row['quantity']}"
        )


def main():
    configure_stdout()
    print("Starting SMMKay -> Google Sheet -> SMMCoder sync.")
    print(f"Check new orders every {CHECK_NEW_ORDER_INTERVAL} seconds.")
    print(f"Check progress every {CHECK_PROGRESS_INTERVAL} seconds.")

    ws = connect_sheet()
    normalize_sheet_layout(ws)
    normalize_existing_id_cells(ws)
    print("Connected to Google Sheet.")

    last_progress_check = 0

    while True:
        try:
            sync_new_orders_to_sheet(ws)
            ensure_start_counts(ws)
            send_pending_orders_to_smmcoder(ws)

            current_time = time.time()
            if current_time - last_progress_check >= CHECK_PROGRESS_INTERVAL:
                check_smmcoder_statuses(ws)
                sync_smmkay_statuses_from_sheet(get_sheet_rows(ws))
                last_progress_check = current_time

        except Exception as exc:
            print(f"ERROR main loop: {exc}")

        time.sleep(CHECK_NEW_ORDER_INTERVAL)


if __name__ == "__main__":
    main()
