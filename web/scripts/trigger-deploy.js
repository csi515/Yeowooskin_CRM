// Vercel 배포 트리거 스크립트
// 사용법: node scripts/trigger-deploy.js

const https = require('https');

const PROJECT_ID = 'prj_2xQf400zau38GIna6YyGRKlCyPzs';
const TEAM_ID = 'team_PA4CUVPRS0ESYk4ZBW9OOx2J';

// Vercel 토큰은 환경변수에서 가져옴
const VERCEL_TOKEN = process.env['VERCEL_TOKEN'];

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN 환경변수가 설정되지 않았습니다.');
  console.log('사용법: $env:VERCEL_TOKEN="your-token"; node scripts/trigger-deploy.js');
  process.exit(1);
}

const options = {
  hostname: 'api.vercel.com',
  path: `/v13/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const data = JSON.stringify({
  name: 'web',
  target: 'production'
});

const req = https.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      const result = JSON.parse(body);
      console.log('✅ 배포가 성공적으로 트리거되었습니다!');
      console.log(`   배포 ID: ${result.id}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   상태: ${result.readyState || 'BUILDING'}`);
    } else {
      console.error(`❌ 배포 트리거 실패: ${res.statusCode}`);
      console.error(body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 요청 오류:', error.message);
});

req.write(data);
req.end();

