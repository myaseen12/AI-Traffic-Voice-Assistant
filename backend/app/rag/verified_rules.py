"""
Verified Pakistan Traffic Statutes & Statutory Fine Schedules
Sources:
- Provincial Motor Vehicles Ordinance, 1965 (MVO 1965)
- National Highways Safety Ordinance, 2000 (NHSO 2000 - NHMP)
- Capital Territory Traffic Regulations (Islamabad Traffic Police - ITP)
- Provincial Motor Vehicles (Amendment) Acts & Rules
"""

VERIFIED_TRAFFIC_RULES = [
    {
        "id": "RULE-113-SPEED",
        "section": "Section 113, Motor Vehicles Ordinance 1965",
        "title_en": "Exceeding Prescribed Speed Limit (Over-Speeding)",
        "title_ur": "مقررہ رفتار سے تجاوز (اوور اسپیڈنگ)",
        "title_ps": "د ټاکلي سرعت څخه تجاوز (ګړندی موټر چلول)",
        "category": "Speeding",
        "penalty_amount": 5000.0,
        "points": 3,
        "jurisdiction": "National Highways, Motorways & Urban Expressways",
        "legal_basis": "No person shall drive a motor vehicle at a speed exceeding the maximum speed limit prescribed by the competent traffic authority.",
        "explanation_en": "You were fined Rs. 5,000 under Section 113 for over-speeding. Driving above the speed limit poses a severe risk to highway and urban safety.",
        "explanation_ur": "آپ کو دفعہ 113 کے تحت حد رفتار سے تجاوز کرنے پر 5000 روپے جرمانہ عائد کیا گیا ہے۔ تیز رفتاری سڑک پر آپ کی اور دوسروں کی جان کے لیے خطرہ ہے۔",
        "explanation_ps": "تاسو ته د 113 مادې لاندې د ټاکلي سرعت نه د زیاتوالي په جرم 5000 روپۍ جرمانه لګول شوې ده. تیز موټر چلول د حادثې سبب کیږي.",
        "keywords": ["speed", "speeding", "fast", "over-speeding", "تیز رفتاری", "رفتار", "سرعت", "ګړندی"]
    },
    {
        "id": "RULE-89A-HELMET",
        "section": "Section 89-A, Motor Vehicles Ordinance 1965",
        "title_en": "Riding Motorcycle without Safety Helmet",
        "title_ur": "حفاظتی ہیلمٹ کے بغیر موٹر سائیکل چلانا",
        "title_ps": "د حفاظتي هیلمټ پرته موټرسایکل چلول",
        "category": "Safety Gear",
        "penalty_amount": 2000.0,
        "points": 2,
        "jurisdiction": "City Traffic Police & Provincial Highways",
        "legal_basis": "No person shall drive or ride on a motorcycle without fastening a safety helmet conforming to prescribed standards.",
        "explanation_en": "You received a fine of Rs. 2,000 under Section 89-A for riding without a certified protective helmet. This applies to both rider and pillion passenger.",
        "explanation_ur": "آپ پر حفاظتی ہیلمٹ نہ پہننے کی پاداش میں دفعہ 89-A کے تحت 2000 روپے جرمانہ کیا گیا ہے۔ یہ قانون ڈرائیور اور پیچھے بیٹھے مسافر دونوں پر لاگو ہے۔",
        "explanation_ps": "تاسو ته د 89-A مادې لاندې د حفاظتي هیلمټ نه کارولو په وجه 2000 روپۍ جرمانه لګول شوې ده. دا حکم د موټرسایکل چلوونکي او شاته ناست کس دواړو لپاره دی.",
        "keywords": ["helmet", "headgear", "bike", "motorcycle", "ہیلمٹ", "موٹرسائیکل", "هیلمټ", "موټرسایکل"]
    },
    {
        "id": "RULE-89B-SEATBELT",
        "section": "Section 89-B, Motor Vehicles Ordinance 1965",
        "title_en": "Driving without Fastening Seatbelt",
        "title_ur": "سیٹ بیلٹ باندھے بغیر گاڑی چلانا",
        "title_ps": "د سیټ بیلټ پرته موټر چلول",
        "category": "Safety Gear",
        "penalty_amount": 1500.0,
        "points": 1,
        "jurisdiction": "All Highways, Motorways and City Roads",
        "legal_basis": "The driver of a motor vehicle and front-seat passenger shall fasten standard safety seatbelts while vehicle is in motion on a public road.",
        "explanation_en": "A penalty of Rs. 1,500 was issued under Section 89-B for failing to fasten a safety seatbelt while driving.",
        "explanation_ur": "دفعہ 89-B کے تحت گاڑی چلاتے وقت سیٹ بیلٹ نہ باندھنے پر 1500 روپے کا چالان کیا گیا ہے۔",
        "explanation_ps": "د 89-B مادې له مخې د سیټ بیلټ نه تړلو له امله 1500 روپۍ چالان شوی دی.",
        "keywords": ["seatbelt", "belt", "safety belt", "سیٹ بیلٹ", "بیلٹ", "سیټ بیلټ"]
    },
    {
        "id": "RULE-112-SIGNAL",
        "section": "Section 112, Motor Vehicles Ordinance 1965",
        "title_en": "Disobeying Traffic Signal (Red Light Violation)",
        "title_ur": "ٹریفک سگنل کی خلاف ورزی (سرخ بتی توڑنا)",
        "title_ps": "د ټرافیکي اشارې سرغړونه (سره اشاره ماتول)",
        "category": "Signals & Controls",
        "penalty_amount": 2500.0,
        "points": 3,
        "jurisdiction": "City Traffic Police & Urban Signals",
        "legal_basis": "Whoever fails to obey the direction given by a traffic signal lamp or traffic sign commits an offense under Section 112.",
        "explanation_en": "You were fined Rs. 2,500 under Section 112 for jumping a red traffic light at an intersection.",
        "explanation_ur": "چوک پر ریڈ سگنل توڑنے کی خلاف ورزی پر دفعہ 112 کے تحت 2500 روپے جرمانہ کیا گیا ہے۔",
        "explanation_ps": "په څلور لارې کې د سرې اشارې نه دریدو له امله د 112 مادې لاندې 2500 روپۍ جرمانه شوې ده.",
        "keywords": ["signal", "red light", "traffic light", "سگنل", "اشارہ", "اشاره", "سره اشاره", "ریڈ سگنل"]
    },
    {
        "id": "RULE-112B-MOBILE",
        "section": "Section 112-B, Motor Vehicles Ordinance 1965",
        "title_en": "Using Mobile Phone while Driving",
        "title_ur": "گاڑی چلاتے ہوئے موبائل فون کا استعمال",
        "title_ps": "د موټر چلولو پر مهال د مبایل کارول",
        "category": "Distracted Driving",
        "penalty_amount": 2000.0,
        "points": 2,
        "jurisdiction": "All Public Roads & Highways",
        "legal_basis": "No person shall hold or operate a cellular phone or handheld communication device while driving a motor vehicle.",
        "explanation_en": "Fine of Rs. 2,000 issued under Section 112-B for using a handheld mobile phone while driving.",
        "explanation_ur": "ڈرائیونگ کے دوران موبائل فون استعمال کرنے پر دفعہ 112-B کے تحت 2000 روپے جرمانہ عائد کیا گیا ہے۔",
        "explanation_ps": "د موټر چلولو په وخت کې په مبایل خبرو کولو یا کارولو له امله د 112-B مادې مطابق 2000 روپۍ جرمانه شوې.",
        "keywords": ["mobile", "phone", "cellphone", "calling", "موبائل", "فون", "مبایل"]
    },
    {
        "id": "RULE-03-LICENSE",
        "section": "Section 3 & 99, Motor Vehicles Ordinance 1965",
        "title_en": "Driving without a Valid Driving License",
        "title_ur": "قانونی ڈرائیونگ لائسنس کے بغیر گاڑی چلانا",
        "title_ps": "د قانوني ډرایوینګ لایسنس پرته موټر چلول",
        "category": "Documentation",
        "penalty_amount": 3000.0,
        "points": 4,
        "jurisdiction": "All Jurisdictions across Pakistan",
        "legal_basis": "No person shall drive a motor vehicle in any public place unless he holds an effective driving license authorizing him to drive the vehicle.",
        "explanation_en": "You were cited Rs. 3,000 under Section 3 for operating a motor vehicle without a valid, active driving license.",
        "explanation_ur": "موثر ڈرائیونگ لائسنس کے بغیر گاڑی چلانے پر دفعہ 3 کے تحت 3000 روپے جرمانہ کیا گیا ہے۔",
        "explanation_ps": "د باوري لایسنس نه درلودلو په جرم د 3 مادې لاندې 3000 روپۍ جریمه لګول شوې ده.",
        "keywords": ["license", "dl", "licence", "لائسنس", "لایسنس"]
    },
    {
        "id": "RULE-99-WRONGSIDE",
        "section": "Section 99, Motor Vehicles Ordinance 1965",
        "title_en": "One-Way Violation / Wrong Side Driving",
        "title_ur": "ون وے یا غلط سمت میں گاڑی چلانا",
        "title_ps": "د یو طرفه سړک سرغړونه یا په غلط لوري تلل",
        "category": "Dangerous Driving",
        "penalty_amount": 2500.0,
        "points": 3,
        "jurisdiction": "City Urban Roads and Highways",
        "legal_basis": "Whoever drives a motor vehicle in contravention of one-way entry signs or driving on wrong side shall be punishable under Section 99 for dangerous driving.",
        "explanation_en": "Fine of Rs. 2,500 under Section 99 for driving against prescribed one-way traffic flow.",
        "explanation_ur": "ون وے کی خلاف ورزی یا غلط سائیڈ پر گاڑی چلانے پر دفعہ 99 کے تحت 2500 روپے جرمانہ عائد کیا گیا ہے۔",
        "explanation_ps": "په غلط طرف یا د یو طرفه سړک د قانون خلاف تګ باندې د 99 مادې لاندې 2500 روپۍ جرمانه شوې.",
        "keywords": ["oneway", "one-way", "wrong side", "ون وے", "غلط سمت", "غلط طرف"]
    },
    {
        "id": "RULE-115-DUI",
        "section": "Section 115, Motor Vehicles Ordinance 1965",
        "title_en": "Driving under Influence of Alcohol or Narcotics",
        "title_ur": "نشے یا الکحل کے زیر اثر گاڑی چلانا",
        "title_ps": "د نشې په حالت کې موټر چلول",
        "category": "DUI / Criminal Offense",
        "penalty_amount": 10000.0,
        "points": 6,
        "jurisdiction": "All Public Roads & High Courts",
        "legal_basis": "Whoever, while driving or attempting to drive a motor vehicle, is under the influence of intoxicating liquor or drug to such an extent as to be incapable of exercising proper control over the vehicle, shall be punishable with imprisonment up to six months or fine up to Rs. 10,000 or both.",
        "explanation_en": "Maximum fine of Rs. 10,000 and possible legal arrest under Section 115 for driving under the influence of intoxicating substances.",
        "explanation_ur": "نشے کی حالت میں ڈرائیونگ پر دفعہ 115 کے تحت 10,000 روپے جرمانہ اور 6 ماہ تک قید کی قانونی سزا تجویز ہے۔",
        "explanation_ps": "د نشې په حالت کې د موټر چلولو په سخته سرغړونه د 115 مادې لاندې 10000 روپۍ جرمانه او قید قانوني سزا ده.",
        "keywords": ["dui", "drink", "alcohol", "drugs", "نیشہ", "شراب", "نشہ"]
    }
]
