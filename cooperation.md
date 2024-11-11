# 협업 관련 안내사항

## 브랜칭 전략

### Github flow vs Git flow

- 규모를 고려해서 Github flow로 진행. main브랜치 밑에 issue 단위로 브랜치를 파서 작업하도록 합시다.

## Issue? 이슈?

기능 단위로 issue를 만들어 작업 합니다.

### 이슈 태그!

BugFix : 버그 수정 시

Design : 디자인 작업

Docs : 문서 관련 작업 및 기능 외 수정사항

Feat : 새로운 기능 추가 시

Help Wanted : 협업 및 도움 필요 시

HotFix : 긴급 수정 사항 발생 시

Modify : 기능의 변화가 있는 코드 수정 시

Refactor : 코드 리펙토링 진행 시

### 이슈 네이밍

이슈 네이밍 컨벤션은

<aside>
💡 (구분): (이슈 내용 요약)

</aside>

**구분**의 종류는

- feat: 기능 추가
- fix: 에러 수정, 버그 수정
- docs: README, 문서
- refactor: 코드 리펙토링 (기능 변경 없이 코드만 수정할 때)
- modify: 코드 수정 (기능의 변화가 있을 때)
- deploy: 배포 관련

가 있고, .github 폴더 안의 issue 컨벤션에서 확인할 수 있습니다.

### 이슈를 생성해봅시다.

![이슈 등록](https://github.com/user-attachments/assets/1e1f5a41-8225-4397-910c-498f4beb5ed8)


이슈 생성 화면에 들어가면 이렇게 나오는데 Title과 내용을 적고, Assignee와 Labels를 등록해주면 됩니다.



이런식으로 issue를 작성하고 **Submit new issue**를 누르면 끝입니다.

### 브랜치 네이밍

issue를 기능 단위로 만들었다면 브랜치를 만들어야합니다. 브랜치 네이밍 컨벤션은

<aside>
💡 (구분)/#(이슈번호)-(브랜치 이름)

</aside>

로 작성하면 됩니다.

예를 들면

- feat/#17-prologue-cutscene
- refactor/#9-monster-script-refactoring

가 있습니다.

**구분은 이슈와 동일합니다.**

## Commit

이슈와 브랜치를 만들었으니, 형식에 맞게 커밋을 해봅시다.

커밋 컨벤션은 다음과 같습니다.

<aside>
💡 (구분): (이슈 내용 요약) #(이슈번호)

</aside>

깃허브 데스크탑에서 커밋을 하게되고 Summary를 작성할 때 #을 누르면

![깃헙데탑](https://github.com/user-attachments/assets/9031a4c5-e4e6-48fc-a4fc-8e3fda18462b)


이런 식으로 우리가 만든 이슈들을 보여주고, 선택하면 자동으로 커밋에 이슈번호가 등록됩니다.

이렇게 커밋과 푸시를 마치고 나면

issue에 시간 순서대로 해당 작업에 대한 로그가 남습니다.

## Pull Request

Issue에 대한 작업을 모두 마쳤다면 해당 issue 브랜치에서 main 브랜치로 PR을 보냅니다.

### PR 네이밍 컨벤션

PR도 커밋과 동일한 네이밍 컨벤션으로 타이틀을 작성 하시면 됩니다.

### PR 작성법

작성법은 먼저 Reviewers와 Assignees와 Labels를 등록합니다.

Assignees와 Labels는 이슈와 동일하고, Reviewers는 내 PR을 확인해야 할 팀원을 등록합니다.

이후 내용 작성

참고할만한 사항은 Related issue에

<aside>
💡 closed #(이슈번호)

</aside>

를 입력하면

이렇게 해당 이슈가 closed 되고, PR 내용에 위와 같이 표기된다는 것 입니다.

그리고 작업 내용과 PR 참고사항을 입력하고 PR을 보내면 됩니다.

PR과 merge를 마치면 로그가 남습니다. 해당 issue에 대한 브랜치는 작업이 완료되었으므로 삭제하면 됩니다.

작업 단위를 세분화 하여 Conflict를 최소화하고, issue와 PR을 통해 정규 회의가 아니더라도 작업 현황을 공유하고 서로 코드 리뷰도 하며 효율적으로 개발해봅시다!
