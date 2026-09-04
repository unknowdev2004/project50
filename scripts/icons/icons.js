/* ============================================
   ICONS.JS — Project 50
   Centralized SVG icon system using Lucide-style icons.

   Exposes: window.P50Icons

   USAGE:
     P50Icons.get('activity')         → raw SVG string
     P50Icons.svg('activity', 20)     → <svg ...> with size
     P50Icons.svg('activity', 20, 'my-class') → with class

   ICON SIZE GUIDE (px):
     16  — tiny badges / inline text
     18  — sidebar links, suggestions
     20  — header buttons, small UI
     24  — search card icon, cat-related-icon
     28  — tool-card-icon
     32  — search-related-icon
     48  — search-empty, cat-empty
     52  — tool-icon (tool page hero)
     60  — cat-hero-icon (category page hero)

   All icons: stroke-based, consistent 2px stroke-width,
   round linecap/join, viewBox="0 0 24 24", no fill.

   LOAD ORDER: before categories.js, renderers.js,
   search.js, search-page.js, category-page.js.
============================================ */

(function (global) {
  'use strict';

  /* ---- Icon path library ---- */
  /* Each value is the inner SVG content (paths/circles/etc).
     The outer <svg> wrapper is added by svg() for flexibility. */
  var PATHS = {

    /* ---- Navigation ---- */
    'home':
      '<path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>' +
      '<polyline points="9 22 9 12 15 12 15 22"/>',

    'search':
      '<circle cx="11" cy="11" r="8"/>' +
      '<path d="m21 21-4.3-4.3"/>',

    'info':
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M12 16v-4"/>' +
      '<path d="M12 8h.01"/>',

    'mail':
      '<rect width="20" height="16" x="2" y="4" rx="2"/>' +
      '<path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',

    /* ---- Categories ---- */
    'activity': /* Health & Fitness */
      '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',

    'graduation-cap': /* Student Tools */
      '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/>' +
      '<path d="M6 12v5c3 3 9 3 12 0v-5"/>',

    'wrench': /* Utility Tools */
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',

    'wallet': /* Finance Tools */
      '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>' +
      '<path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>' +
      '<path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',

    'palette': /* Creator Tools */
      '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>' +
      '<circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>' +
      '<circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>' +
      '<circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>' +
      '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',

    /* ---- Tool icons: Health & Fitness ---- */
    'scale': /* BMI Calculator */
      '<path d="M12 3v1"/>' +
      '<path d="M3 9h18"/>' +
      '<path d="M5.5 9 4 21h16l-1.5-12"/>' +
      '<path d="m7 9 1.5-6M17 9l-1.5-6"/>',

    'salad': /* Daily Calorie Planner */
      '<path d="M7 21h10"/>' +
      '<path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/>' +
      '<path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-3.19 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/>' +
      '<path d="m13 12 4-4"/>' +
      '<path d="M10.9 7.25A3.99 3.99 0 0 0 4 10c0 .73.2 1.41.54 2"/>',

    'droplets': /* Water Intake */
      '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/>' +
      '<path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/>',

    'ruler': /* Body Fat */
      '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/>' +
      '<path d="m14.5 12.5 2-2"/>' +
      '<path d="m11.5 9.5 2-2"/>' +
      '<path d="m8.5 6.5 2-2"/>',

    'target': /* Ideal Weight */
      '<circle cx="12" cy="12" r="10"/>' +
      '<circle cx="12" cy="12" r="6"/>' +
      '<circle cx="12" cy="12" r="2"/>',

    'beef': /* Macro Calculator */
      '<circle cx="12.5" cy="8.5" r="2.5"/>' +
      '<path d="M12.5 2a6.5 6.5 0 0 0-6.22 4.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3A6.5 6.5 0 0 0 12.5 2Z"/>' +
      '<path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1 .31 2 6.49 6.49 0 0 1-2.6 5.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5"/>',

    'heart-pulse': /* Heart Rate */
      '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' +
      '<path d="M3.22 12H9.5l1.5-3 2 4.5 1.5-2.5H20.78"/>',

    'moon': /* Sleep Calculator */
      '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',

    'footprints': /* Running Pace */
      '<path d="M4 16v-2.5C4 12.7 3.3 12 2.5 12H2v-2h.5A4.5 4.5 0 0 1 7 14.5V16a2 2 0 0 0 2 2h2"/>' +
      '<path d="M4.268 20.236A2 2 0 0 0 6 21a2 2 0 0 0 .732-3.856"/>' +
      '<path d="M20 16v-2.5c0-.8.7-1.5 1.5-1.5H22v-2h-.5A4.5 4.5 0 0 0 17 14.5V16a2 2 0 0 1-2 2h-2"/>' +
      '<path d="M19.732 17.144A2 2 0 0 1 18 21a2 2 0 0 1-.732-3.856"/>',

    'steps': /* Step Counter */
      '<path d="m7 20-2-5"/>' +
      '<path d="m17 20 2-5"/>' +
      '<path d="M11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" transform="translate(1 4)"/>' +
      '<path d="m8 14 1-4h6l1 4"/>',

    /* ---- Tool icons: Student Tools ---- */
    'bar-chart-2': /* GPA Calculator */
      '<line x1="18" x2="18" y1="20" y2="10"/>' +
      '<line x1="12" x2="12" y1="20" y2="4"/>' +
      '<line x1="6" x2="6" y1="20" y2="14"/>',

    'calculator': /* Grade Calculator */
      '<rect width="16" height="20" x="4" y="2" rx="2"/>' +
      '<line x1="8" x2="16" y1="6" y2="6"/>' +
      '<line x1="8" x2="8" y1="14" y2="14"/>' +
      '<line x1="12" x2="12" y1="14" y2="14"/>' +
      '<line x1="16" x2="16" y1="14" y2="14"/>' +
      '<line x1="8" x2="8" y1="18" y2="18"/>' +
      '<line x1="12" x2="12" y1="18" y2="18"/>' +
      '<line x1="16" x2="16" y1="18" y2="18"/>',

    'timer': /* Pomodoro Timer */
      '<path d="M10 2h4"/>' +
      '<path d="M12 14v-4"/>' +
      '<path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6"/>' +
      '<path d="M9 17H4v5"/>',

    'file-text': /* Word Counter */
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>' +
      '<path d="M14 2v4a2 2 0 0 0 2 2h4"/>' +
      '<path d="M10 9H8"/>' +
      '<path d="M16 13H8"/>' +
      '<path d="M16 17H8"/>',

    'layout-list': /* Essay Outline */
      '<rect width="7" height="7" x="3" y="3" rx="1"/>' +
      '<rect width="7" height="7" x="3" y="14" rx="1"/>' +
      '<path d="M14 4h7"/>' +
      '<path d="M14 9h7"/>' +
      '<path d="M14 15h7"/>' +
      '<path d="M14 20h7"/>',

    'book-open': /* Citation Generator */
      '<path d="M12 7v14"/>' +
      '<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',

    'pencil': /* Note Taker */
      '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>' +
      '<path d="m15 5 4 4"/>',

    'calendar': /* Study Planner */
      '<path d="M8 2v4"/>' +
      '<path d="M16 2v4"/>' +
      '<rect width="18" height="18" x="3" y="4" rx="2"/>' +
      '<path d="M3 10h18"/>',

    'layers': /* Flashcard Maker */
      '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>' +
      '<path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>' +
      '<path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',

    /* ---- Tool icons: Utility Tools ---- */
    'shield': /* Password Generator */
      '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',

    'refresh-cw': /* Unit Converter */
      '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>' +
      '<path d="M21 3v5h-5"/>' +
      '<path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>' +
      '<path d="M8 16H3v5"/>',

    'cake': /* Age Calculator */
      '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/>' +
      '<path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/>' +
      '<path d="M2 21h20"/>' +
      '<path d="M7 8v2"/>' +
      '<path d="M12 8v2"/>' +
      '<path d="M17 8v2"/>' +
      '<path d="M7 4h.01"/>' +
      '<path d="M12 4h.01"/>' +
      '<path d="M17 4h.01"/>',

    'calendar-check': /* Attendance Calculator */
      '<path d="M8 2v4"/>' +
      '<path d="M16 2v4"/>' +
      '<rect width="18" height="18" x="3" y="4" rx="2"/>' +
      '<path d="M3 10h18"/>' +
      '<path d="m9 16 2 2 4-4"/>',

    'calendar-clock': /* Study Hours & Exam Planner */
      '<path d="M8 2v4"/>' +
      '<path d="M16 2v4"/>' +
      '<path d="M21 11.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.5"/>' +
      '<path d="M3 10h18"/>' +
      '<circle cx="17" cy="17" r="4"/>' +
      '<path d="M17 15.5v1.5l1 .75"/>',

    'calendar-days': /* Date Calculator */
      '<path d="M8 2v4"/>' +
      '<path d="M16 2v4"/>' +
      '<rect width="18" height="18" x="3" y="4" rx="2"/>' +
      '<path d="M3 10h18"/>' +
      '<path d="M8 14h.01"/>' +
      '<path d="M12 14h.01"/>' +
      '<path d="M16 14h.01"/>' +
      '<path d="M8 18h.01"/>' +
      '<path d="M12 18h.01"/>' +
      '<path d="M16 18h.01"/>',

    'qr-code': /* QR Generator */
      '<rect width="5" height="5" x="3" y="3" rx="1"/>' +
      '<rect width="5" height="5" x="16" y="3" rx="1"/>' +
      '<rect width="5" height="5" x="3" y="16" rx="1"/>' +
      '<path d="M21 16h-3a2 2 0 0 0-2 2v3"/>' +
      '<path d="M21 21v.01"/>' +
      '<path d="M12 7v3a2 2 0 0 1-2 2H7"/>' +
      '<path d="M3 12h.01"/>' +
      '<path d="M12 3h.01"/>' +
      '<path d="M12 16v.01"/>' +
      '<path d="M16 12h1"/>' +
      '<path d="M21 12v.01"/>',

    'code': /* Base64 Encoder */
      '<polyline points="16 18 22 12 16 6"/>' +
      '<polyline points="8 6 2 12 8 18"/>',

    'braces': /* JSON Formatter */
      '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/>' +
      '<path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',

    'globe': /* IP Lookup */
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>' +
      '<path d="M2 12h20"/>',

    'dice-5': /* Random Number */
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>' +
      '<path d="M16 8h.01"/>' +
      '<path d="M8 8h.01"/>' +
      '<path d="M8 16h.01"/>' +
      '<path d="M16 16h.01"/>' +
      '<path d="M12 12h.01"/>',

    'type': /* Text Case */
      '<polyline points="4 7 4 4 20 4 20 7"/>' +
      '<line x1="9" x2="15" y1="20" y2="20"/>' +
      '<line x1="12" x2="12" y1="4" y2="20"/>',

    /* ---- Tool icons: Finance Tools ---- */
    'landmark': /* EMI Calculator */
      '<line x1="3" x2="21" y1="22" y2="22"/>' +
      '<line x1="6" x2="6" y1="18" y2="11"/>' +
      '<line x1="10" x2="10" y1="18" y2="11"/>' +
      '<line x1="14" x2="14" y1="18" y2="11"/>' +
      '<line x1="18" x2="18" y1="18" y2="11"/>' +
      '<polygon points="12 2 20 7 4 7"/>',

    'trending-up': /* SIP Calculator */
      '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>' +
      '<polyline points="16 7 22 7 22 13"/>',

    'receipt': /* Tax Calculator */
      '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>' +
      '<path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>' +
      '<path d="M12 17.5v-11"/>',

    'percent': /* Compound Interest */
      '<line x1="19" x2="5" y1="5" y2="19"/>' +
      '<circle cx="6.5" cy="6.5" r="2.5"/>' +
      '<circle cx="17.5" cy="17.5" r="2.5"/>',

    'briefcase': /* Budget Planner */
      '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' +
      '<rect width="20" height="14" x="2" y="6" rx="2"/>',

    'banknote': /* Salary Calculator */
      '<rect width="20" height="12" x="2" y="6" rx="2"/>' +
      '<circle cx="12" cy="12" r="2"/>' +
      '<path d="M6 12h.01M18 12h.01"/>',

    'arrow-left-right': /* Currency Converter */
      '<path d="M8 3 4 7l4 4"/>' +
      '<path d="M4 7h16"/>' +
      '<path d="m16 21 4-4-4-4"/>' +
      '<path d="M20 17H4"/>',

    'utensils': /* Tip Calculator */
      '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>' +
      '<path d="M7 2v20"/>' +
      '<path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',

    'tag': /* Discount Calculator */
      '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/>' +
      '<circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',

    'trending-down': /* Inflation Calculator */
      '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>' +
      '<polyline points="16 17 22 17 22 11"/>',

    /* ---- Tool icons: Creator Tools ---- */
    'pipette': /* Color Palette */
      '<path d="m2 22 1-1h3l9-9"/>' +
      '<path d="M3 21v-3l9-9"/>' +
      '<path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8-3 3-1.4-1.4 3-3z"/>',

    'text-cursor-input': /* Font Pairer */
      '<path d="M5 4h1a3 3 0 0 1 0 6H5"/>' +
      '<path d="M19 6v6"/>' +
      '<path d="M5 10h6"/>' +
      '<rect width="4" height="6" x="15" y="14" rx="2"/>' +
      '<path d="M5 14h3"/>' +
      '<path d="M5 18h4"/>' +
      '<path d="M5 14v4"/>',

    'blend': /* Gradient Maker */
      '<circle cx="9" cy="9" r="7"/>' +
      '<circle cx="15" cy="15" r="7"/>',

    'image': /* Image Resizer */
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>' +
      '<circle cx="9" cy="9" r="2"/>' +
      '<path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',

    'maximize-2': /* Aspect Ratio */
      '<polyline points="15 3 21 3 21 9"/>' +
      '<polyline points="9 21 3 21 3 15"/>' +
      '<line x1="21" x2="14" y1="3" y2="10"/>' +
      '<line x1="3" x2="10" y1="21" y2="14"/>',

    'layout': /* Social Media Sizes */
      '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>' +
      '<line x1="3" x2="21" y1="9" y2="9"/>' +
      '<line x1="9" x2="9" y1="21" y2="9"/>',

    'tags': /* Meta Tag Generator */
      '<path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z"/>' +
      '<path d="M6 9.01V9"/>' +
      '<path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/>',

    'align-left': /* Lorem Ipsum */
      '<line x1="21" x2="3" y1="6" y2="6"/>' +
      '<line x1="15" x2="3" y1="12" y2="12"/>' +
      '<line x1="17" x2="3" y1="18" y2="18"/>',

    'contrast': /* Contrast Checker */
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M12 18a6 6 0 0 0 0-12v12z"/>',

    'shapes': /* Icon Finder */
      '<path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.3.3 0 0 1 .726.124L13.2 6.25a1 1 0 0 0 1.8.25l2.5-3.5"/>' +
      '<path d="m18 10 1 6"/>' +
      '<path d="m2 10 7 9h4"/>' +
      '<circle cx="18" cy="18" r="3"/>' +
      '<circle cx="5" cy="19" r="2"/>',

    /* ---- UI state icons ---- */
    'clock': /* Recent / History */
      '<circle cx="12" cy="12" r="10"/>' +
      '<polyline points="12 6 12 12 16 14"/>',

    'alert-triangle': /* Warning / Error */
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>' +
      '<path d="M12 9v4"/>' +
      '<path d="M12 17h.01"/>',

    'star': /* Popular badge */
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',

    'arrow-right': /* CTA / navigation arrow */
      '<path d="M5 12h14"/>' +
      '<path d="m12 5 7 7-7 7"/>',

    'x': /* Close */
      '<path d="M18 6 6 18"/>' +
      '<path d="m6 6 12 12"/>',

    'sun': /* Light mode */
      '<circle cx="12" cy="12" r="4"/>' +
      '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',

    'menu': /* Hamburger */
      '<line x1="4" x2="20" y1="6" y2="6"/>' +
      '<line x1="4" x2="20" y1="12" y2="12"/>' +
      '<line x1="4" x2="16" y1="18" y2="18"/>',

    /* ---- Shared SEO section icons ---- */
    'book': /* Features / Learn More */
      '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',

    'list': /* How-to / Steps */
      '<line x1="8" x2="21" y1="6" y2="6"/>' +
      '<line x1="8" x2="21" y1="12" y2="12"/>' +
      '<line x1="8" x2="21" y1="18" y2="18"/>' +
      '<line x1="3" x2="3.01" y1="6" y2="6"/>' +
      '<line x1="3" x2="3.01" y1="12" y2="12"/>' +
      '<line x1="3" x2="3.01" y1="18" y2="18"/>',

    'help-circle': /* FAQ */
      '<circle cx="12" cy="12" r="10"/>' +
      '<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>' +
      '<path d="M12 17h.01"/>',
  };

  /* ---- Default fallback for unknown icons ---- */
  var DEFAULT = 'wrench';

  /* ---- Public API ---- */

  /**
   * Get the inner SVG path string for an icon name.
   * @param {string} name
   * @returns {string}
   */
  function get(name) {
    return PATHS[name] || PATHS[DEFAULT];
  }

  /**
   * Build a complete <svg> element string.
   * @param {string}  name    — icon key (e.g. 'activity')
   * @param {number}  [size]  — pixel size for width/height (default 20)
   * @param {string}  [cls]   — additional CSS class string
   * @returns {string}        — full <svg>...</svg> HTML string
   */
  function svg(name, size, cls) {
    size = size || 20;
    var classAttr = cls ? ' class="' + cls + '"' : '';
    return (
      '<svg' + classAttr +
      ' xmlns="http://www.w3.org/2000/svg"' +
      ' width="' + size + '" height="' + size + '"' +
      ' viewBox="0 0 24 24"' +
      ' fill="none"' +
      ' stroke="currentColor"' +
      ' stroke-width="2"' +
      ' stroke-linecap="round"' +
      ' stroke-linejoin="round"' +
      ' aria-hidden="true">' +
      get(name) +
      '</svg>'
    );
  }

  /* ---- Expose ---- */
  global.P50Icons = {
    get: get,
    svg: svg,
    _paths: PATHS   /* exposed for debugging; not part of public API */
  };

})(window);
