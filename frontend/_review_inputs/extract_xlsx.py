import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def col_to_index(cell_ref):
    letters = re.match(r"([A-Z]+)", cell_ref).group(1)
    idx = 0
    for ch in letters:
        idx = idx * 26 + ord(ch) - ord("A") + 1
    return idx - 1


def text_of(node):
    if node is None:
        return ""
    return "".join(node.itertext())


def load_shared_strings(zf):
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []
    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    return [text_of(si) for si in root.findall("main:si", NS)]


def parse_cell(cell, shared_strings):
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return text_of(cell.find("main:is", NS)).strip()
    value = cell.find("main:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell_type == "s":
        try:
            return shared_strings[int(raw)]
        except (ValueError, IndexError):
            return raw
    return raw


def workbook_sheets(zf):
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("pkgrel:Relationship", NS)
    }
    sheets = []
    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        rid = sheet.attrib[f"{{{NS['rel']}}}id"]
        target = rel_map[rid].lstrip("/")
        if not target.startswith("xl/"):
            target = f"xl/{target}"
        sheets.append((sheet.attrib["name"], target))
    return sheets


def parse_sheet(zf, path, shared_strings):
    root = ET.fromstring(zf.read(path))
    rows = []
    for row in root.findall("main:sheetData/main:row", NS):
        values = []
        max_seen = -1
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "A1")
            idx = col_to_index(ref)
            while len(values) <= idx:
                values.append("")
            values[idx] = parse_cell(cell, shared_strings)
            max_seen = max(max_seen, idx)
        rows.append(values[: max_seen + 1])
    return rows


def main():
    xlsx_path = Path(sys.argv[1])
    result = {}
    with zipfile.ZipFile(xlsx_path) as zf:
        shared_strings = load_shared_strings(zf)
        for name, path in workbook_sheets(zf):
            result[name] = parse_sheet(zf, path, shared_strings)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
