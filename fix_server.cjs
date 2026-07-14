const fs = require('fs');
let content = fs.readFileSync('/Users/yoon/Desktop/PUCO/server.js', 'utf8');

const replacement = `  const translateToEn = (text) => {
    const dict = {
      "시나리오 상황과 매칭되는 센서 감지를 활성화함.": "Activate sensor detection matching the scenario.",
      "키워드 의도에 맞춰 모션 자세 제어를 수행함.": "Execute motion control matching the keyword intent.",
      "동작 반응에 맞춘 연동 프로젝션 영역을 투사함.": "Project corresponding display aligned with motion response.",
      "감정 표현을 위한 스피커 반응을 재생함.": "Play speaker response for emotional expression."
    };
    return dict[text] || text;
  };

  function matchLocalScenario(inputText, useEnglish) {
    const text = inputText.trim();
    
    // Dynamic Multi-match mapping engine
    const matchedSN = [];
    const matchedMP = [];
    const matchedPJ = [];
    const matchedSP = [];

    const isToFTrigger = ["거리", "가깝", "가까이", "멀어", "다가오", "이탈", "접근", "cm", "m", "초점", "스케일", "재질", "평탄", "근접"].some(w => text.includes(w));
    const isCameraTrigger = ["바라", "쳐다", "보더", "보니", "얼굴", "표정", "눈", "시선", "자세", "동작", "포즈", "제스처", "손", "발", "사람", "인원", "터치", "조도", "밝기", "사물", "객체", "도구"].some(w => text.includes(w));

    // Dynamic scoring using getMatchScore logic from earlier context
    const getMatchScore = (input, item) => {
      let score = 0;
      const lowerInput = input.toLowerCase();
      if (!item.keywords && !item.grammar) return score;
      
      const words = input.split(' ');
      const dbKeywords = (item.keywords || []).concat([item.grammar, item.category, item.name, item.desc].filter(Boolean));
      for (const kw of dbKeywords) {
        if (!kw) continue;
        const lowerKw = kw.toLowerCase();
        if (lowerInput.includes(lowerKw)) score += 5;
        for (const word of words) {
          if (word.includes(lowerKw) || lowerKw.includes(word)) score += 2;
        }
      }
      return score;
    };

    // Evaluate all SN capabilities
    for (const item of capabilityDb.SN) {
      if (item.enabled === false) continue;
      const score = getMatchScore(text, item);
      const isToFCode = item.code.startsWith("SN-A");
      if (isToFCode && !isToFTrigger && score < 15) continue;
      if (!isToFCode && !isCameraTrigger && score < 15) continue;
      if (score >= 5.0) matchedSN.push({ code: item.code, score: score });
    }

    // Evaluate MP
    for (const item of capabilityDb.MP) {
      if (item.enabled === false) continue;
      const score = getMatchScore(text, item);
      if (score >= 6.0) matchedMP.push({ code: item.code, score: score });
    }

    // Evaluate PJ 
    const isProjectionNeeded = ["빔", "투사", "화면", "스크린", "보여", "표시", "영상", "이미지", "빛", "조명", "벽", "테이블"].some(w => text.includes(w));
    if (isProjectionNeeded) {
      for (const item of capabilityDb.PJ) {
        if (item.enabled === false) continue;
        const score = getMatchScore(text, item);
        if (score >= 6.0) matchedPJ.push({ code: item.code, score: score });
      }
    }

    // Evaluate SP 
    const isSpeakerNeeded = ["소리", "음성", "말하", "말했", "음악", "효과음", "노래", "사운드", "안내", "말해", "대답", "목소리", "톤"].some(w => text.includes(w));
    if (isSpeakerNeeded) {
      for (const item of capabilityDb.SP) {
        if (item.enabled === false) continue;
        const score = getMatchScore(text, item);
        if (score >= 6.0) matchedSP.push({ code: item.code, score: score });
      }
    }

    const sortAndFormat = (items, labelKo, labelEn) => {
      return items
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => ({
          code: item.code,
          reason: useEnglish ? \`Activated due to trigger matching \${labelEn}.\` : \`상황 인풋 분석 결과 \${labelKo} 거동에 부합함.\`
        }));
    };

    let finalSN = sortAndFormat(matchedSN, "센서 감지", "sensing trigger");
    if (finalSN.length === 0) {
      if (isToFTrigger) {
        finalSN = [{ code: "SN-A-01", reason: "물리적 거리/접근 센서 선행 작동" }];
      } else if (isCameraTrigger) {
        finalSN = [{ code: "SN-B-01", reason: "시각 인식을 위한 카메라 센서 선행 작동" }];
      }
    }

    const missingIntent = text.length < 8;
    const summaryText = useEnglish 
      ? \`Estimated capabilities match for: "\${text.substring(0, 15)}\${text.length > 15 ? '...' : ''}"\`
      : \`입력 상황 "\${text.substring(0, 15)}\${text.length > 15 ? '...' : ''}"에 대한 최적 추정 매칭 결과\`;

    const intentNoteText = missingIntent 
      ? (useEnglish ? "Provide explicit triggers and robot emotions to improve matching." : "구체적인 트리거와 로봇의 감정을 명시하면 더 명확해요.")
      : "";

    return {
      summary: summaryText,
      missingIntent: missingIntent,
      intentNote: intentNoteText,
      SN: finalSN,
      MP: sortAndFormat(matchedMP, "모션 반응", "motion response"),
      PJ: sortAndFormat(matchedPJ, "투사 반응", "projection response"),
      SP: sortAndFormat(matchedSP, "스피커 반응", "speaker response")
    };
  }
`;

const startIndex = content.indexOf('  const translateToEn = (text) => {');
const endIndex = content.indexOf('app.post(\'/api/match\', async (req, res) => {');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement + '\n\n' + content.substring(endIndex);
  fs.writeFileSync('/Users/yoon/Desktop/PUCO/server.js', content, 'utf8');
  console.log('Successfully replaced matchLocalScenario in server.js.');
} else {
  console.log('Failed to find start or end index in server.js.');
}
