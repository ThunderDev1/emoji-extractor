const fs = require('fs');
const axios = require('axios');

async function run() {

  const response = await axios.get('https://emojipedia.org/google/android-5.0/')

  const matchedEmojiCodes = response.data.match(/(1f\S{3}-?){1,2}(?=\.png)/gm);
  // Remove duplicates
  const codes = Array.from(new Set(matchedEmojiCodes));

  console.log(`Found ${codes.length} emoji codes in source file`);

  var emojiMartConfig = JSON.parse(fs.readFileSync('./node_modules/emoji-mart/data/google.json', 'utf8'));

  const emojiNames = [];

  const emojiMartEmojis = Object.keys(emojiMartConfig.emojis);

  emojiMartEmojis.forEach(emojiName => {
    const emojiMartCode = emojiMartConfig.emojis[emojiName].b.toLowerCase();
    if (codes.includes(emojiMartCode)) {
      emojiNames.push(emojiName);
    }
  });

  console.log(`Found ${emojiNames.length} corresponding emojis in emoji-mart file`);

  let removedCount = 0;

  emojiMartEmojis.forEach(emojiName => {
    if (!emojiNames.includes(emojiName)) {
      delete emojiMartConfig.emojis[emojiName];
      removedCount++;
    }
  });

  console.log(`Removed ${removedCount} emojis from emoji-mart file`);

  emojiMartConfig.categories.forEach(category => {
    category.emojis = category.emojis.filter((emoji) => emojiNames.includes(emoji));
  });

  const filteredConfig = JSON.stringify(emojiMartConfig);
  fs.writeFileSync(`filteredConfig-${Date.now()}.json`, filteredConfig, 'utf8');
}

run();