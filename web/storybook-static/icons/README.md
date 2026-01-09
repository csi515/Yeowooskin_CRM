# PWA 아이콘 파일

이 디렉토리에는 PWA 아이콘 파일들이 위치해야 합니다.

## 필요한 아이콘 파일

- `icon-192.png` - 192x192 픽셀
- `icon-512.png` - 512x512 픽�el

## 아이콘 생성 방법

1. 온라인 도구 사용:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)

2. 이미지 편집 도구 사용:
   - 원본 이미지를 512x512 크기로 준비
   - 192x192와 512x512 두 가지 크기로 리사이즈
   - PNG 형식으로 저장

## 임시 아이콘 생성 (개발용)

개발 단계에서는 다음 명령어로 간단한 아이콘을 생성할 수 있습니다:

```bash
# ImageMagick이 설치되어 있는 경우
convert -size 512x512 xc:#2c3e50 -pointsize 200 -fill white -gravity center -annotate +0+0 "B" public/icons/icon-512.png
convert public/icons/icon-512.png -resize 192x192 public/icons/icon-192.png
```

또는 온라인 도구를 사용하여 간단한 아이콘을 생성한 후 이 디렉토리에 배치하세요.

