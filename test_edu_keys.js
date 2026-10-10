
const fs = require('fs');
let code = fs.readFileSync('public/content_data.js', 'utf8');
let window = {};
eval(code);
console.log("Root keys:", Object.keys(window.EDU_DATA));
if (window.EDU_DATA.languages) console.log("languages count:", window.EDU_DATA.languages.length);
if (window.EDU_DATA.historyEpisodes) console.log("historyEpisodes count:", window.EDU_DATA.historyEpisodes.length);
if (window.EDU_DATA.cars) console.log("cars count:", window.EDU_DATA.cars.length);
