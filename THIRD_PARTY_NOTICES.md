# Third-party notices

Yuanzi Bazi Agent Kit depends on open-source packages listed in `package-lock.json`. Runtime calendar calculations use:

## tyme4ts 1.5.2

Project: <https://github.com/6tail/tyme4ts>

License: MIT

Copyright (c) 2024 6tail

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Chart renderer and font

PNG rendering uses @resvg/resvg-js 2.6.2 (MPL-2.0), https://github.com/yisibl/resvg-js. Dependency packages retain their own notices.

`assets/YuanziChartSans.otf` is a subset of Noto Sans CJK SC Regular, renamed Yuanzi Chart Sans. `assets/YuanziChartSerif.otf` is a subset of Noto Serif CJK SC SemiBold, renamed Yuanzi Chart Serif. Both originate from the Noto CJK project. They are licensed under SIL Open Font License 1.1; the source attribution and license are bundled in `assets/FONT-LICENSE.txt`. Font licensing is separate from this project's MIT code license. The subset contains only characters needed for the fixed chart layout and calculated facts; no customer data is included.
