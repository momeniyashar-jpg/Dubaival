# -*- coding: utf-8 -*-
"""
Build "Christ in the Mirror of Art" PDF.
Layout: minimal, elegant, museum-catalogue style. A4. ReportLab canvas-based.
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fonts_setup as fs
from content import COVER, INTRO_TITLE_FA, INTRO_TITLE_EN, INTRO_BODY_FA, INTRO_BODY_EN, \
    ARTWORKS, SOURCES_TITLE, SOURCES_NOTE_FA, COMPILED_BY

fs.register_fonts()

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

IVORY = colors.HexColor("#FAF6ED")
CHARCOAL = colors.HexColor("#2B2A26")
CHARCOAL_SOFT = colors.HexColor("#5B594F")
GOLD = colors.HexColor("#9C7A3C")
GOLD_LIGHT = colors.HexColor("#C9A85E")
HAIRLINE = colors.HexColor("#D9CFB8")

SERIF = fs.SERIF
SERIF_B = fs.SERIF_BOLD
SERIF_I = fs.SERIF_ITALIC
SERIF_BI = fs.SERIF_BOLD_ITALIC


def new_canvas(path):
    c = canvas.Canvas(path, pagesize=A4)
    return c


def paint_background(c):
    c.setFillColor(IVORY)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


def centered_text(c, text, cx, y, font, size, color=CHARCOAL):
    c.setFont(font, size)
    c.setFillColor(color)
    c.drawCentredString(cx, y, text)


def tracked_centered(c, text, cx, y, font, size, color, tracking=2.2):
    """Approximate letter-spacing for small caps kickers."""
    c.setFont(font, size)
    total_w = sum(c.stringWidth(ch, font, size) + tracking for ch in text) - tracking
    x = cx - total_w / 2
    c.setFillColor(color)
    for ch in text:
        c.drawString(x, y, ch)
        x += c.stringWidth(ch, font, size) + tracking


def hairline(c, y, x0=None, x1=None, color=HAIRLINE, width=0.6):
    x0 = MARGIN if x0 is None else x0
    x1 = PAGE_W - MARGIN if x1 is None else x1
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x0, y, x1, y)


def draw_rtl_paragraph(c, text, right_x, top_y, font, size, leading, max_width, color=CHARCOAL, align="right"):
    lines = fs.wrap_rtl_paragraph(text, font, size, max_width)
    c.setFont(font, size)
    c.setFillColor(color)
    y = top_y
    for line in lines:
        if align == "right":
            c.drawRightString(right_x, y, line)
        else:
            c.drawCentredString(right_x, y, line)
        y -= leading
    return y


def draw_ltr_paragraph(c, text, left_x, top_y, font, size, leading, max_width, color=CHARCOAL, align="left", cx=None):
    lines = fs.wrap_ltr_paragraph(text, font, size, max_width)
    c.setFont(font, size)
    c.setFillColor(color)
    y = top_y
    for line in lines:
        if align == "center":
            c.drawCentredString(cx, y, line)
        else:
            c.drawString(left_x, y, line)
        y -= leading
    return y


def fit_image(path, max_w, max_h):
    with Image.open(path) as im:
        w, h = im.size
    scale = min(max_w / w, max_h / h)
    return w * scale, h * scale


def draw_image_framed(c, path, cx, top_y, max_w, max_h):
    dw, dh = fit_image(path, max_w, max_h)
    x = cx - dw / 2
    y = top_y - dh
    c.drawImage(path, x, y, width=dw, height=dh, preserveAspectRatio=True, mask='auto')
    c.setStrokeColor(HAIRLINE)
    c.setLineWidth(0.75)
    c.rect(x, y, dw, dh, stroke=1, fill=0)
    return y  # bottom of image


# ---------------------------------------------------------------- COVER ----

def render_cover(c):
    paint_background(c)
    cx = PAGE_W / 2
    tracked_centered(c, COVER["kicker_en"], cx, PAGE_H - 34 * mm, SERIF, 10, GOLD, tracking=3.2)
    hairline(c, PAGE_H - 38 * mm, x0=cx - 20 * mm, x1=cx + 20 * mm, color=GOLD_LIGHT, width=0.8)

    title_line = fs.shape_rtl(COVER["title_fa"])
    c.setFont(SERIF_B, 40)
    c.setFillColor(CHARCOAL)
    c.drawCentredString(cx, PAGE_H / 2 + 18 * mm, title_line)

    sub_line = fs.shape_rtl(COVER["subtitle_fa"])
    c.setFont(SERIF, 15)
    c.setFillColor(CHARCOAL_SOFT)
    c.drawCentredString(cx, PAGE_H / 2 + 4 * mm, sub_line)

    hairline(c, PAGE_H / 2 - 6 * mm, x0=cx - 14 * mm, x1=cx + 14 * mm, color=GOLD_LIGHT, width=0.8)
    centered_text(c, "•", cx, PAGE_H / 2 - 6 * mm - 3.2, SERIF, 9, GOLD)

    centered_text(c, COVER["title_en"], cx, PAGE_H / 2 - 20 * mm, SERIF_I, 17, CHARCOAL)
    centered_text(c, COVER["subtitle_en"], cx, PAGE_H / 2 - 28 * mm, SERIF, 10.5, CHARCOAL_SOFT)

    c.showPage()


# ---------------------------------------------------------------- INTRO ----

def render_intro(c):
    paint_background(c)
    cx = PAGE_W / 2
    y = PAGE_H - MARGIN - 6 * mm

    title_fa_line = fs.shape_rtl(INTRO_TITLE_FA)
    c.setFont(SERIF_B, 20)
    c.setFillColor(CHARCOAL)
    c.drawCentredString(cx, y, title_fa_line)
    y -= 6 * mm
    centered_text(c, INTRO_TITLE_EN, cx, y, SERIF_I, 11, GOLD)
    y -= 8 * mm
    hairline(c, y, x0=cx - 22 * mm, x1=cx + 22 * mm, color=GOLD_LIGHT)
    y -= 14 * mm

    right_x = PAGE_W - MARGIN
    for para in INTRO_BODY_FA.split("\n\n"):
        y = draw_rtl_paragraph(c, para, right_x, y, SERIF, 11.5, 18.5, CONTENT_W, CHARCOAL)
        y -= 9 * mm

    y -= 4 * mm
    hairline(c, y, color=HAIRLINE)
    y -= 10 * mm

    for para in INTRO_BODY_EN.split("\n\n"):
        y = draw_ltr_paragraph(c, para, None, y, SERIF_I, 9.5, 14.5, CONTENT_W, CHARCOAL_SOFT,
                                align="center", cx=cx)
        y -= 7 * mm

    c.showPage()


# ------------------------------------------------------------- ARTWORKS ----

SECTION_LABELS = {
    "history": "نگاه تاریخی",
    "message": "پیام مسیحی",
    "why": "چرا این اثر مهم است؟",
}


def render_artwork_page(c, art, image_dir):
    paint_background(c)
    cx = PAGE_W / 2
    right_x = PAGE_W - MARGIN
    y = PAGE_H - MARGIN + 2 * mm

    # Plate number kicker
    tracked_centered(c, f"PLATE {art['no']}", cx, y, SERIF, 9, GOLD, tracking=3.0)
    y -= 8 * mm

    # Quote (EN italic + FA)
    c.setFont(SERIF_I, 10.5)
    c.setFillColor(CHARCOAL_SOFT)
    c.drawCentredString(cx, y, "“" + art["quote_en"].strip("“”") + "”")
    y -= 6.2 * mm
    fa_q = fs.shape_rtl("«" + art["quote_fa"].strip("«»") + "»")
    c.setFont(SERIF, 10.5)
    c.setFillColor(CHARCOAL_SOFT)
    c.drawCentredString(cx, y, fa_q)
    y -= 9 * mm

    # Image
    image_path = os.path.join(image_dir, f"{art['no']}.jpg")
    max_img_h = 102 * mm
    max_img_w = CONTENT_W * 0.80
    if os.path.exists(image_path):
        img_bottom = draw_image_framed(c, image_path, cx, y, max_img_w, max_img_h)
        y = img_bottom - 8 * mm
    else:
        # visible placeholder box so a missing image is never silently invisible
        box_h = max_img_h
        box_w = max_img_w
        c.setStrokeColor(colors.red)
        c.setDash(3, 2)
        c.rect(cx - box_w / 2, y - box_h, box_w, box_h, stroke=1, fill=0)
        c.setFont(SERIF, 10)
        c.setFillColor(colors.red)
        c.drawCentredString(cx, y - box_h / 2, "MISSING IMAGE: " + art["title"])
        c.setDash()
        y = y - box_h - 8 * mm

    # Title / metadata
    centered_text(c, art["title"], cx, y, SERIF_B, 17, CHARCOAL)
    y -= 6.2 * mm
    meta = f"{art['artist']}  ·  {art['date']}  ·  {art['location']}"
    centered_text(c, meta, cx, y, SERIF_I, 9, CHARCOAL_SOFT)
    y -= 5 * mm
    hairline(c, y, color=GOLD_LIGHT, width=0.8)
    y -= 8 * mm

    body_size = 9.4
    body_leading = 13.9
    label_size = 10.4

    for key, field in (("history", "history_fa"), ("message", "message_fa"), ("why", "why_fa")):
        label = fs.shape_rtl(SECTION_LABELS[key])
        c.setFont(SERIF_B, label_size)
        c.setFillColor(GOLD)
        c.drawRightString(right_x, y, label)
        y -= 6.2 * mm
        y = draw_rtl_paragraph(c, art[field], right_x, y, SERIF, body_size, body_leading, CONTENT_W, CHARCOAL)
        y -= 5.5 * mm

    # Bible verse block
    y -= 1 * mm
    hairline(c, y, x0=cx - 30 * mm, x1=cx + 30 * mm, color=HAIRLINE)
    y -= 6.5 * mm
    centered_text(c, art["verse_ref"], cx, y, SERIF_B, 9, GOLD)
    y -= 5.5 * mm
    centered_text(c, art["verse_en"], cx, y, SERIF_I, 9, CHARCOAL_SOFT)
    y -= 5.5 * mm
    fa_v = fs.shape_rtl(art["verse_fa"])
    c.setFont(SERIF, 9)
    c.setFillColor(CHARCOAL_SOFT)
    c.drawCentredString(cx, y, fa_v)

    c.showPage()


# -------------------------------------------------------------- SOURCES ----

def render_sources(c, image_credits):
    paint_background(c)
    cx = PAGE_W / 2
    y = PAGE_H - MARGIN - 4 * mm
    centered_text(c, SOURCES_TITLE, cx, y, SERIF_B, 18, CHARCOAL)
    y -= 9 * mm
    right_x = PAGE_W - MARGIN
    y = draw_rtl_paragraph(c, SOURCES_NOTE_FA, right_x, y, SERIF, 9.5, 14.5, CONTENT_W, CHARCOAL_SOFT)
    y -= 6 * mm
    hairline(c, y, color=GOLD_LIGHT)
    y -= 9 * mm

    left_x = MARGIN
    for art in ARTWORKS:
        if y < MARGIN + 30 * mm:
            c.showPage()
            paint_background(c)
            y = PAGE_H - MARGIN

        c.setFont(SERIF_B, 10.5)
        c.setFillColor(CHARCOAL)
        c.drawString(left_x, y, f"{art['no']} — {art['title']}")
        y -= 5 * mm
        c.setFont(SERIF, 8.6)
        c.setFillColor(CHARCOAL_SOFT)
        credit = image_credits.get(art["no"], {})
        lines = [
            f"Institution: {art['location']}",
            f"Artist: {art['artist']}",
            f"Approximate date: {art['date']}",
            f"Biblical reference: {art['verse_ref']}",
        ]
        if credit.get("source_name"):
            lines.append(f"Image source: {credit['source_name']}")
        for line in lines:
            c.drawString(left_x, y, line)
            y -= 4.3 * mm
        y -= 3 * mm

    y -= 4 * mm
    hairline(c, y, color=HAIRLINE)
    y -= 8 * mm
    centered_text(c, COMPILED_BY, cx, y, SERIF_I, 10, CHARCOAL_SOFT)

    c.showPage()


# ------------------------------------------------------------------ MAIN ---

def build(output_path, image_dir, image_credits=None):
    image_credits = image_credits or {}
    c = new_canvas(output_path)
    render_cover(c)
    render_intro(c)
    for art in ARTWORKS:
        render_artwork_page(c, art, image_dir)
    render_sources(c, image_credits)
    c.save()


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/christ_art_test.pdf"
    img_dir = sys.argv[2] if len(sys.argv) > 2 else os.path.join(here, "..", "assets", "images")
    build(out, img_dir)
    print("Built:", out)
