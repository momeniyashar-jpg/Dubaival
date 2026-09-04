# -*- coding: utf-8 -*-
"""Font registration + Persian/Arabic RTL shaping helpers for ReportLab."""

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from bidi.algorithm import get_display

FREE_DIR = "/usr/share/fonts/truetype/freefont"

SERIF = "DVSerif"
SERIF_BOLD = "DVSerif-Bold"
SERIF_ITALIC = "DVSerif-Italic"
SERIF_BOLD_ITALIC = "DVSerif-BoldItalic"

_registered = False


def register_fonts():
    global _registered
    if _registered:
        return
    pdfmetrics.registerFont(TTFont(SERIF, f"{FREE_DIR}/FreeSerif.ttf"))
    pdfmetrics.registerFont(TTFont(SERIF_BOLD, f"{FREE_DIR}/FreeSerifBold.ttf"))
    pdfmetrics.registerFont(TTFont(SERIF_ITALIC, f"{FREE_DIR}/FreeSerifItalic.ttf"))
    pdfmetrics.registerFont(TTFont(SERIF_BOLD_ITALIC, f"{FREE_DIR}/FreeSerifBoldItalic.ttf"))
    _registered = True


def shape_rtl(text: str) -> str:
    """Reshape Persian/Arabic text and reorder to visual order for direct LTR drawing."""
    return get_display(arabic_reshaper.reshape(text))


def wrap_rtl_paragraph(text, font_name, font_size, max_width):
    """Greedy word-wrap of a logical-order Persian string; returns list of visual-order lines."""
    words = text.split(" ")
    lines = []
    current = []
    for w in words:
        trial = current + [w]
        trial_text = " ".join(trial)
        reshaped = arabic_reshaper.reshape(trial_text)
        width = pdfmetrics.stringWidth(reshaped, font_name, font_size)
        if width <= max_width or not current:
            current = trial
        else:
            lines.append(" ".join(current))
            current = [w]
    if current:
        lines.append(" ".join(current))
    return [get_display(arabic_reshaper.reshape(line)) for line in lines]


def wrap_ltr_paragraph(text, font_name, font_size, max_width):
    words = text.split(" ")
    lines = []
    current = []
    for w in words:
        trial = current + [w]
        trial_text = " ".join(trial)
        width = pdfmetrics.stringWidth(trial_text, font_name, font_size)
        if width <= max_width or not current:
            current = trial
        else:
            lines.append(" ".join(current))
            current = [w]
    if current:
        lines.append(" ".join(current))
    return lines
