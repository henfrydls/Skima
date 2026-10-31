// Side-effect module, imported first in main.jsx: modules run at import time
// (dataPreload fetches /api/data as soon as it loads), so the wrapper has to be
// in place before any of them is evaluated.
import { installApiHeader } from './apiBase';

installApiHeader();
