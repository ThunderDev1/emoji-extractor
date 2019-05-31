const fs = require("fs");
const fetch = require("node-fetch");

/*
  // the emoji code is in the image link
  // eg. https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/72/google/3/grinning-face_1f600.png
  // code is 1f600
*/
const extractEmojipediaCodes = pageBody => {
  const matchedEmojiCodes = pageBody.match(/(1f\S{3}-?){1,2}(?=\.png)/gm);
  distinctCodes = Array.from(new Set(matchedEmojiCodes));
  console.log(`Found ${distinctCodes.length} emoji codes in source file`);
  return distinctCodes;
};

const getEmojiMartNames = (codes, emojiMartConfig) => {
  const emojiMartEmojis = Object.keys(emojiMartConfig.emojis);
  const emojiNames = emojiMartEmojis.map(emojiName => {
    const emojiMartCode = emojiMartConfig.emojis[emojiName].b.toLowerCase();
    return codes.includes(emojiMartCode) && emojiName;
  });

  console.log(`Found ${emojiNames.length} matching emojis in emoji-mart file`);
  return emojiNames;
};

const getRequiredEmojis = (emojiMartConfig, requiredEmojiNames) => {
  const emojiMartEmojis = Object.keys(emojiMartConfig.emojis);

  return emojiMartEmojis.reduce((requiredEmojis, emojiName) => {
    if (requiredEmojiNames.includes(emojiName)) {
      requiredEmojis[emojiName] = { ...emojiMartConfig.emojis[emojiName] };
    }
    return requiredEmojis;
  }, {});
};

const getRequiredCategories = (emojiMartCategories, requiredEmojiNames) => {
  const requiredCategories = emojiMartCategories.map(category => {
    const { emojis, otherProps } = category;

    return {
      ...otherProps,
      emojis: emojis.filter(emojiName => requiredEmojiNames.includes(emojiName))
    };
  });
  return requiredCategories;
};

const extract = pageBody => {
  const emojiMartConfig = JSON.parse(
    fs.readFileSync("./node_modules/emoji-mart/data/google.json", "utf8")
  );

  const emojipediaCodes = extractEmojipediaCodes(pageBody);

  const requiredEmojiNames = getEmojiMartNames(
    emojipediaCodes,
    emojiMartConfig
  );

  const requiredEmojis = getRequiredEmojis(emojiMartConfig, requiredEmojiNames);

  const requiredCategories = getRequiredCategories(
    emojiMartConfig.categories,
    requiredEmojiNames
  );

  const newConfig = {
    compressed: true,
    emojis: requiredEmojis,
    categories: requiredCategories
  };

  fs.writeFileSync(
    `filteredConfig-${Date.now()}.json`,
    JSON.stringify(newConfig),
    "utf8"
  );
};

const run = () => {
  fetch("https://emojipedia.org/google/android-5.0/")
    .then(response => response.text())
    .then(body => extract(body));
};

run();
