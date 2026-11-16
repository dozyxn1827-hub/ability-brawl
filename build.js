const fs = require('fs');
const src = (f) => fs.readFileSync(__dirname + '/src/' + f, 'utf8');
const js = ['01-util.js', '02-spec.js', '025-compose.js', '03-art.js', '04-engine.js', '05-input.js', '055-audio.js', '06-net.js', '07-ui.js', '08-flow.js'].map(src).join('\n');
const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>능력 난투</title>
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Sans+KR:wght@400;600&family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
${src('style.css')}
</style>
</head>
<body>
<div id="app"></div>
<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(__dirname + '/dist/index.html', html);
// 독립 서버용: 연결 장치를 게임 코드보다 먼저 넣는다
fs.mkdirSync(__dirname + '/server/public', { recursive: true });
fs.writeFileSync(__dirname + '/server/public/index.html', html.replace('<script>\n', '<script>\n' + fs.readFileSync(__dirname + '/server/shim.js', 'utf8') + '\n'));
console.log('built', (html.length / 1024).toFixed(1) + ' KB');
