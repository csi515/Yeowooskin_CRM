// 간단한 아이콘 생성 스크립트 (Canvas API 사용)
// 실제로는 사용자가 제공한 이미지를 사용해야 합니다.

const fs = require('fs');
const path = require('path');

// 아이콘 디렉토리 확인
const iconDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

console.log('아이콘 디렉토리가 준비되었습니다:', iconDir);
console.log('사용자가 제공한 이미지 파일을 /workspace/web/public/icons/icon-512.png 경로에 배치해주세요.');
console.log('이미지 파일은 512x512 픽셀 PNG 형식이어야 합니다.');
