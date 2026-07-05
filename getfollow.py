import html
import re
from urllib.parse import urlparse, urlunparse

import requests


def normalize_facebook_uri(uri: str) -> str:
    uri = uri.strip()
    if not uri.startswith(("http://", "https://")):
        uri = "https://" + uri

    parsed = urlparse(uri)
    host = parsed.netloc.lower()

    if host in {"facebook.com", "web.facebook.com"}:
        host = "www.facebook.com"

    path = parsed.path or "/"
    if not path.endswith("/"):
        path += "/"

    return urlunparse(("https", host, path, "", parsed.query, ""))


def make_mobile_uri(uri: str, host: str) -> str:
    parsed = urlparse(uri)
    return urlunparse(("https", host, parsed.path, "", parsed.query, ""))


def decode_page_text(page_text: str) -> str:
    page_text = html.unescape(page_text)

    # Facebook often returns JSON-ish text with unicode escapes:
    # "143 ng\u01b0\u1eddi theo d\u00f5i"
    page_text = re.sub(
        r"\\u[0-9a-fA-F]{4}",
        lambda match: chr(int(match.group(0)[2:], 16)),
        page_text,
    )

    return page_text


def parse_compact_number(raw_number: str) -> int:
    text = raw_number.strip().lower().replace("\xa0", " ")

    multiplier = 1
    if text.endswith(("k", "nghìn", "ngan")):
        multiplier = 1_000
        text = re.sub(r"(k|nghìn|ngan)$", "", text).strip()
    elif text.endswith(("m", "tr", "triệu", "trieu")):
        multiplier = 1_000_000
        text = re.sub(r"(m|tr|triệu|trieu)$", "", text).strip()

    if multiplier > 1:
        text = text.replace(",", ".")
        return int(float(text) * multiplier)

    return int(re.sub(r"[^\d]", "", text))


def extract_followers(page_text: str):
    page_text = decode_page_text(page_text)

    patterns = [
        r'"text"\s*:\s*"([\d.,]+\s*(?:k|m|nghìn|ngan|tr|triệu|trieu)?)\s+người theo dõi"',
        r"([\d.,]+\s*(?:k|m|nghìn|ngan|tr|triệu|trieu)?)\s+người theo dõi",
        r'"text"\s*:\s*"([\d.,]+\s*(?:k|m)?)\s+followers"',
        r"([\d.,]+\s*(?:k|m)?)\s+followers",
    ]

    for pattern in patterns:
        match = re.search(pattern, page_text, re.IGNORECASE)
        if match:
            return parse_compact_number(match.group(1))

    return None


def get_facebook_followers(uri: str, cookie: str = ""):
    uri = normalize_facebook_uri(uri)
    candidates = [
        uri,
        make_mobile_uri(uri, "m.facebook.com"),
        make_mobile_uri(uri, "mbasic.facebook.com"),
    ]

    session = requests.Session()
    session.headers.update(
        {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "accept-language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
            "cache-control": "no-cache",
            "pragma": "no-cache",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "none",
            "upgrade-insecure-requests": "1",
            "user-agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        }
    )

    if cookie:
        session.headers["cookie"] = cookie

    last_error = None

    for candidate in candidates:
        try:
            response = session.get(candidate, timeout=30, allow_redirects=True)
        except requests.RequestException as error:
            last_error = f"{candidate}: {error}"
            continue

        followers = extract_followers(response.text)
        if followers is not None:
            return followers, candidate, response.status_code

        last_error = (
            f"{candidate}: HTTP {response.status_code}, "
            "khong tim thay chuoi nguoi theo doi trong HTML tra ve"
        )

    raise RuntimeError(last_error or "Khong lay duoc trang Facebook")


if __name__ == "__main__":
    uri = input("Nhap Facebook followers URI: ").strip()

    # Neu Facebook yeu cau dang nhap, dan cookie vao day.
    # Vi du: c_user=...; xs=...; fr=...
    cookie = ""

    try:
        followers, used_uri, status_code = get_facebook_followers(uri, cookie)
        print(f"So nguoi theo doi: {followers}")
        print(f"Lay tu: {used_uri}")
        print(f"HTTP status: {status_code}")
    except RuntimeError as error:
        print("Khong tim thay so nguoi theo doi.")
        print(error)
        print("Neu Facebook tra trang dang nhap/chan request, hay them cookie c_user va xs vao bien cookie.")
