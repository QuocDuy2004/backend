# -*- coding: utf-8 -*-

from share import (
    CHECK_NEW_ORDER_INTERVAL,
    REST_BETWEEN_ORDERS,
    configure_stdout,
    connect_sheet,
    load_pages,
    normalize_existing_id_cells,
    normalize_sheet_layout,
    process_sheet_order,
    get_sheet_rows,
    is_pending_status,
)
from itertools import cycle
import time


def get_next_pending_row(ws):
    for row in get_sheet_rows(ws):
        if is_pending_status(row["status"]) and row["link"] and row["quantity"] > 0:
            return row
    return None


def main():
    configure_stdout()
    print("Starting Google Sheet -> Facebook Share runner.")
    print("Source: rows with Status=Pending, using each ID's Link and Quantity.")
    print("SMMKay API is disabled; Google Sheet is the only order source.")

    ws = connect_sheet()
    normalize_sheet_layout(ws)
    normalize_existing_id_cells(ws)
    print("Connected to Google Sheet.")

    pages = load_pages()
    if not pages:
        print("No Facebook pages found. Check pages.json or token.txt/cookie.txt.")
        return

    page_iterator = cycle(pages)
    while True:
        row = get_next_pending_row(ws)
        if not row:
            print("No Pending row in Google Sheet.")
            time.sleep(CHECK_NEW_ORDER_INTERVAL)
            continue

        process_sheet_order(ws, row, page_iterator)
        time.sleep(REST_BETWEEN_ORDERS)


if __name__ == "__main__":
    main()
