// import axios from 'axios';

// const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your API key
// const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

// export const translateText = async (text, targetLang = 'es') => {
//   try {
//     const response = await axios.post(
//       `${GOOGLE_TRANSLATE_URL}?key=${GOOGLE_API_KEY}`,
//       {
//         q: text,
//         target: targetLang,
//       }
//     );

//     if (response.data && response.data.data.translations[0]) {
//       return response.data.data.translations[0].translatedText;
//     }

//     return text;
//   } catch (error) {
//     console.error('Translation Error:', error);
//     return text;
//   }
// };

export const translateText = async (text) => {
  return text; // no translation, just return the same text
};