import { squareSearch } from './square_search.js';

const haystack = [69, 49, 4, 50, 47, 95, 60, 31, 32, 77, 67, 41, 33, 98, 16, 13, 68, 90, 42, 99, 27, 7, 52];
const needle   = 42;

const found = squareSearch(haystack, needle);

if (found !== -1) {
  console.log(`The needle, ${needle}, is found at cell ${found}`);
}
