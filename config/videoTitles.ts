// Video titles configuration
// Each title has English, Hindi, and Punjabi versions
// Titles will be filtered based on selected language in the upload form

export interface VideoTitle {
  english: string;
  hindi: string;
  punjabi: string;
}

export const videoTitles: VideoTitle[] = [
  { english: "A Cloud of Trash", hindi: "कचरे का बादल", punjabi: "ਕੁੜੇ ਦਾ ਬੱਦਲ" },
  { english: "A Street or a Zoo", hindi: "गली है या चिड़ियाघर", punjabi: "ਇੱਕ ਗਲੀ ਜਾਂ ਇੱਕ ਚਿੜੀਆਘਰ?" },
  { english: "Aaloo Maaloo Kaaloo", hindi: "आलू मालू कालू", punjabi: "ਆਲੂ-ਮਾਲੂ-ਕਾਲੂ" },
  { english: "Abdul Kalam, A Lesson for my Teacher", hindi: "अब्दुल कलाम, मेरे अध्यापक के लिए एक पाठ ", punjabi: "ਮੇਰੇ ਅਧਿਆਪਕ ਲਈ ਇੱਕ ਸਬਕ" },
  { english: "Abdul Kalam, Designing a Fighter Jet", hindi: "अब्दुल कलाम, फाइटर जैट का डिज़ाइन बनाना", punjabi: "ਅਬਦੁਲ ਕਲਾਮ, ਫਾਈਟਰ ਜੈਟ ਦਾ ਡਿਜ਼ਾਈਨ ਬਣਾਉਣਾ" },
  { english: "Abdul Kalam, Failure to Success", hindi: "अब्दुल कलाम, असफ़लता से सफ़लता की ओर", punjabi: "ਅਬਦੁਲ ਕਲਾਮ, ਅਸਫਲਤਾ ਤੋਂ ਸਫਲਤਾ" },
  { english: "Abdul Kalam, Missile Man", hindi: "अब्दुल कलाम, मिसाइल मैन", punjabi: "ਅਬਦੁਲ ਕਲਾਮ, ਮਿਸਾਈਲ ਮੈਨ" },
  { english: "Abdul Kalam, School Topper", hindi: "अब्दुल कलाम, मैं प्रथम आया", punjabi: "ਅਬਦੁਲ ਕਲਾਮ, ਮੈਂ ਪਹਿਲਾ ਆਇਆ" },
  { english: "Ammus Puppy", hindi: "अम्मू का कुत्ता", punjabi: "ਅੰਮੂ ਦਾ ਕੁੱਤਾ" },
  { english: "Bheema, the Sleepyhead", hindi: "भीमा गधा", punjabi: "ਭੀਮਾ ਗਧਾ" },
  { english: "Bunty and Bubbly", hindi: "बंटी और बबली", punjabi: "ਬੰਟੀ ਅਤੇ ਬਬਲੀ" },
  { english: "Cheeku & Chikootichoo", hindi: "चीकू और चिकूटिचू", punjabi: "ਚੀਕੂ ਅਤੇ ਚਿਕੂਟੀਚੂ" },
  { english: "Cheeku & Lizzy Bizzy", hindi: "चीकू और लिज़्ज़ी बिज़्ज़ी", punjabi: "ਚੀਕੂ ਅਤੇ ਲਿਜ਼ੀ ਬਿਜ਼ੀ" },
  { english: "Cheeku & Tooi", hindi: "चीकू और तूई", punjabi: "ਚੀਕੂ ਅਤੇ ਤੂਈ" },
  { english: "Cricket at the Zoo", hindi: "चिड़ियाघर में क्रिकेट", punjabi: "ਚਿੜੀਆਘਰ ਵਿੱਚ ਕ੍ਰਿਕੇਟ" },
  { english: "Didi and the Colourful Treasure", hindi: "दीदी और उनका रंग-बिरंगा खज़ाना", punjabi: "ਦੀਦੀ ਅਤੇ ਉਨ੍ਹਾਂ ਦਾ ਰੰਗ-ਬਿਰੰਗਾ ਖਜ਼ਾਨਾ" },
  { english: "Farida Plans a Feast", hindi: "फरीदा की दावत", punjabi: "ਫਰੀਦਾ ਦੀ ਦਾਵਤ" },
  { english: "Gajapati Kulapati", hindi: "गजपति कुलपति", punjabi: "ਗਜਪਤੀ ਕੁਲਪਤੀ" },
  { english: "Kiran Bedi, Crane Bedi", hindi: "किरण बेदी, क्रेन बेदी", punjabi: "ਕਿਰਣ ਬੇਦੀ, ਕ੍ਰੇਨ ਬੇਦੀ" },
  { english: "Kiran Bedi, How to Lose a Shoe", hindi: "किरण बेदी, अगर एक जूता खो जाये", punjabi: "ਕਿਰਣ ਬੇਦੀ, ਜੇ ਇੱਕ ਜੁੱਤਾ ਖੋ ਜਾਵੇ" },
  { english: "Kiran Bedi, Thank you Mr. Secretary", hindi: "किरण बेदी, शुक्रिया सेक्रेटरी साहब", punjabi: "ਕਿਰਣ ਬੇਦੀ, ਧੰਨਵਾਦ ਸਕੱਤਰ ਸਾਹਿਬ" },
  { english: "Kiran Bedi, Tihar Jail", hindi: "किरण बेदी, तिहाड़ जेल", punjabi: "ਕਿਰਣ ਬੇਦੀ, ਤਿਹਾੜ ਜੇਲ" },
  { english: "Lost and Found", hindi: "खोया पाया", punjabi: "ਖੋਇਆ ਪਾਇਆ" },
  { english: "Mahatma Gandhi, The Salt March", hindi: "महात्मा गांधी, नमक सत्याग्रह", punjabi: "ਮਹਾਤਮਾ ਗਾਂਧੀ, ਨਮਕ ਸਤਿਆਗ੍ਰਹਿ" },
  { english: "My Car", hindi: "मेरी कार", punjabi: "ਮੇਰੀ ਕਾਰ" },
  { english: "No Smiles Today", hindi: "हँसना मना है", punjabi: "ਹੱਸਣਾ ਮਨਾ ਹੈ" },
  { english: "Pishi Caught in a Storm", hindi: "पिशि फँसी तूफ़ान में", punjabi: "ਪਿਸ਼ੀ ਤੂਫਾਨ ਵਿੱਚ ਫਸੀ" },
  { english: "Punyakoti the Cow", hindi: "पुण्यकोटि गाय", punjabi: "ਪੁਣਯਕੋਟੀ ਗਾਂ" },
  { english: "Rain Rain", hindi: "बरसा बादल", punjabi: "ਬਰਸਾ ਬੱਦਲ" },
  { english: "Ranis First Day at School", hindi: "स्कूल का पहला दिन", punjabi: "ਸਕੂਲ ਦਾ ਪਹਿਲਾ ਦਿਨ" },
  { english: "Rosa Goes to the City", hindi: "हाथी शहर को गया", punjabi: "ਹਾਥੀ ਸ਼ਹਿਰ ਨੂੰ ਗਿਆ" },
  { english: "Satya, Watch Out!", hindi: "सत्या, ज़रा संभल के!", punjabi: "ਸਤਿਆ, ਜ਼ਰਾ ਸੰਭਾਲ ਕੇ!" },
  { english: "The First Well", hindi: "पहला कुआँ", punjabi: "ਪਹਿਲਾ ਕੂਆਂ" },
  { english: "The Flying Elephant", hindi: "उड़नहाथी", punjabi: "ਉਡਨਹਾਥੀ" },
  { english: "The Four Friends", hindi: "चार मित्र", punjabi: "ਚਾਰ ਮਿੱਤਰ" },
  { english: "The Greatest Treasure", hindi: "सबसे बड़ा खज़ाना", punjabi: "ਸਭ ਤੋਂ ਵੱਡਾ ਖਜ਼ਾਨਾ" },
  { english: "The Kings Secret", hindi: "राजा का राज़", punjabi: "ਰਾਜਾ ਦਾ ਰਾਜ਼" },
  { english: "The Lion and the Fox", hindi: "शेर और लोमड़ी", punjabi: "ਸ਼ੇਰ ਅਤੇ ਲੂੰਬੜੀ" },
  { english: "The Monks New Shawl", hindi: "भिक्षु का नया शॉल", punjabi: "ਭਿਕਸ਼ੂ ਦਾ ਨਵਾਂ ਸ਼ਾਲ" },
  { english: "The Moon and the Cap", hindi: "चंदा और टोपी", punjabi: "ਚੰਦਾ ਅਤੇ ਟੋਪੀ" },
  { english: "The Princess Farmer", hindi: "किसान राजकुमारी", punjabi: "ਕਿਸਾਨ ਰਾਜਕੁਮਾਰੀ" },
  { english: "The Talkative Tortoise", hindi: "बातूनी कछुआ", punjabi: "ਬਾਤੂਨੀ ਕੱਛੂ" },
  { english: "The Wind and the Sun", hindi: "हवा और सूरज", punjabi: "ਹਵਾ ਅਤੇ ਸੂਰਜ" },
  { english: "Timmy and Pepe", hindi: "टिमी और पेपे", punjabi: "ਟਿਮੀ ਅਤੇ ਪੇਪੇ" },
  { english: "Too Big Too Small", hindi: "बहुत बड़ी! बहुत छोटी!", punjabi: "ਬਹੁਤ ਵੱਡੀ! ਬਹੁਤ ਛੋਟੀ!" },
  { english: "Too Many Bananas", hindi: "केले के गुच्छे", punjabi: "ਬਹੁਤ ਸਾਰੇ ਕੇਲੇ" },
  { english: "Too Much Noise", hindi: "इतना सारा शोर शराबा", punjabi: "ਇੰਨਾ ਸਾਰਾ ਸ਼ੋਰ ਸ਼ਰਾਬਾ" },
  { english: "Turtles Flute", hindi: "कछुए की बांसुरी", punjabi: "ਕੱਛੂ ਦੀ ਬਾਂਸੁਰੀ" },
  { english: "Vayu, the Wind", hindi: "वायु ̶ ­­­­यह है हवा!", punjabi: "ਵਾਯੂ - ਇਹ ਹੈ ਹਵਾ!" },
  { english: "What did you see", hindi: "तुमने क्या देखा?", punjabi: "ਤੁਸੀਂ ਕੀ ਦੇਖਿਆ?" },
];

// Helper function to get title items for dropdown based on language
export const getTitleItems = (language: "en" | "hi" | "pa" = "en") => {
  return videoTitles.map((title) => {
    let label = title.english;
    if (language === "hi") {
      label = title.hindi;
    } else if (language === "pa") {
      label = title.punjabi;
    }
    return {
      label: label,
      value: label,
    };
  });
};
