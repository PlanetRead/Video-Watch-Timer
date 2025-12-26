// Stardost video titles configuration
// Stardost only has Hindi and English versions (no Punjabi)

export interface StardostVideoTitle {
  english: string;
  hindi: string;
}

export const stardostVideoTitles: StardostVideoTitle[] = [
  { english: "Bunty and Bubbly", hindi: "बंटी और बबली" },
  { english: "The Moon and the Cap", hindi: "चंदा और टोपी" },
  { english: "Too Big! Too Small!", hindi: "बहुत बड़ी बहुत छोटी" },
  { english: "A Book for Puchkku", hindi: "ड्रिप-ड्रॉप-ड्रिप" },
  { english: "What's Neema Eating Today", hindi: "आक्छू" },
  { english: "Zippy, the Zebra", hindi: "नौका की सैर" },
  { english: "Janice Goes to Chinatown", hindi: "मुफ्त की कुल्फी" },
  { english: "Folktale behind Naming", hindi: "फ़रीदा की दावत" },
  { english: "Tucket the Bucket", hindi: "टकेट नाम की बाल्टी" },
  { english: "Gajapati Kulapati", hindi: "गजपति कुलपति" },
  { english: "Mahatma Gandhi - The Salt March", hindi: "महात्मा गांधी, नमक सत्याग्रह" },
  { english: "The River and the Mountain", hindi: "नदी और पहाड़" },
  { english: "Punyakoti, the Cow", hindi: "पुण्यकोटि गाय" },
  { english: "Lara the Yellow Ladybird", hindi: "लारा पीली लेडीबर्ड" },
  { english: "Ritu's Letter Gets Longer", hindi: "रितु का पत्र लंबा हो जाता है" },
  { english: "Ammachis Investigation", hindi: "अम्माची की जांच" },
  { english: "Tine and the Faraway Mountain", hindi: "टाइन और दूर का पहाड़" },
  { english: "Ammu's Puppy", hindi: "अम्मू का कुत्ता" },
  { english: "A Lesson for My Teacher", hindi: "मेरे अध्यापक के लिए एक पाठ" },
];

// Helper function to get stardost title items for dropdown based on language
export const getStardostTitleItems = (language: "en" | "hi" = "en") => {
  return stardostVideoTitles.map((title) => {
    const label = language === "hi" ? title.hindi : title.english;
    return {
      label: label,
      value: label,
    };
  });
};

