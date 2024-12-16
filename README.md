# WebP_2024
Web Programming 2024
# 설치 및 실행 방법

안녕하십니까. PlayMingo: Music Recommendation System에 관심을 가져주셔서 감사합니다.

이 프로젝트는 Spotify API를 활용하여 사용자에게 개인화된 추천 곡에 대한 경험을 제공합니다.

보다 직관적인 인터페이스로 편하게 사용하실 수 있습니다. 

현재 개발 단계로, 로컬 서버 구현이 어렵다고 판단하여 개인의 API를 사용하셔야 합니다.

코드 전체를 클론 받은 뒤, 루트 폴더에 keys.txt 파일 내부에 다음과 같이 작성 후 실제 키를 받아오셔야 합니다.

`SPOTIFY_CLIENT_ID=Your_client_id`

`SPOTIFY_CLIENT_ID=Your_client_secret`

스포티파이 개발자 페이지([https://developer.spotify.com/](https://developer.spotify.com/))에 로그인해서 클라이언트 id와 secret을 받아주세요.

- 대시보드에 들어가서 Create app을 통해 권한을 생성하고,

![image](https://github.com/user-attachments/assets/8dee631f-82a9-476e-9509-fecbb9170bd0)


- 다음과 같이 초기화 한 뒤 받으시면 됩니다. 내부의 이름들을 상황에 맞게 변경해주세요.

<img width="1078" alt="image 1" src="https://github.com/user-attachments/assets/c192b62c-2618-4077-bb08-a43e8e39c0d2" />

- client secret은 ID 아래쪽에 클릭하면 나옵니다.

- 추가로 이 페이지는 재생 기능 등의 프리미엄 계정 기능을 활용하기 때문에, 메인 페이지 이외에는 별도의 로그인이 필요합니다. 따라서 프리미엄 권한을 가진 스포티파이 계정이 필요합니다.

- 이제 VS Code의 Live Server 등의 기능을 활용해서 테스트하시면 됩니다. 감사합니다.
