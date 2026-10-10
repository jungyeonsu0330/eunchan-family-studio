
const fs = require('fs');
let code = fs.readFileSync('public/content_data.js', 'utf8');
let window = {};
eval(code);

console.log('--- dad ---');
console.log(window.EDU_DATA.dad);

console.log('--- languages[0] sample ---');
if (window.EDU_DATA.languages && window.EDU_DATA.languages.length > 0) {
    const l0 = window.EDU_DATA.languages[0];
    console.log({ id: l0.id, name: l0.name, icon: l0.icon, itemsCount: l0.items ? l0.items.length : 0 });
    if (l0.items && l0.items.length > 0) {
        console.log('item 0 keys:', Object.keys(l0.items[0]));
    }
}

console.log('--- carsData / cars ---');
if (window.EDU_DATA.carsData) {
    console.log('carsData keys or length:', Array.isArray(window.EDU_DATA.carsData) ? window.EDU_DATA.carsData.length : Object.keys(window.EDU_DATA.carsData));
    if (Array.isArray(window.EDU_DATA.carsData) && window.EDU_DATA.carsData.length > 0) {
        console.log('sample car:', { id: window.EDU_DATA.carsData[0].id, name: window.EDU_DATA.carsData[0].name });
    }
}
