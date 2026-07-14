const fs = require('fs');
const files = ['/Users/yoon/Desktop/PUCO/api/match.js', '/Users/yoon/Desktop/PUCO/server.js'];

const replacement = `  const translateToEn = (text) => {
    const dict = {
      "시나리오 상황과 매칭되는 센서 감지를 활성화함.": "Activate sensor detection matching the scenario.",
      "키워드 의도에 맞춰 모션 자세 제어를 수행함.": "Execute motion control matching the keyword intent.",
      "동작 반응에 맞춘 연동 프로젝션 영역을 투사함.": "Project corresponding display aligned with motion response.",
      "감정 표현을 위한 스피커 반응을 재생함.": "Play speaker response for emotional expression."
    };
    return dict[text] || text;
  };

  function matchLocalScenario(inputText, useEnglishFlag) {
    const text = inputText.trim();
    const useEng = typeof useEnglish !== 'undefined' ? useEnglish : (useEnglishFlag || false);
    
    const matchedSN = [];
    const matchedMP = [];
    const matchedPJ = [];
    const matchedSP = [];

    // Evaluate Trigger categories
    const isToFTrigger = ["거리", "가깝", "가까이", "멀어", "다가오", "이탈", "접근", "cm", "m", "초점", "스케일", "재질", "평탄", "근접"].some(w => text.includes(w));
    const isCameraTrigger = ["바라", "쳐다", "보더", "보니", "얼굴", "표정", "눈", "시선", "자세", "동작", "포즈", "제스처", "손", "발", "사람", "인원", "터치", "조도", "밝기", "사물", "객체", "도구"].some(w => text.includes(w));

    // Dynamic scoring using localScenarios + db
    const getMatchScore = (input, item, categoryType) => {
      let score = 0;
      const lowerInput = input.toLowerCase();
      
      // Boost from localScenarios mapping
      for (const rule of localScenarios) {
        if (rule.keywords.some(k => lowerInput.includes(k))) {
          if (categoryType === 'SN' && rule.sensing === item.code) score += 20;
          if (categoryType === 'MP' && rule.motion === item.code) score += 20;
          if (categoryType === 'PJ' && rule.projection === item.code) score += 20;
          if (categoryType === 'SP' && rule.speaker === item.code) score += 20;
        }
      }

      // Basic text matching against DB fields
      const dbKeywords = [item.category, item.name, item.desc].filter(Boolean);
      for (const kw of dbKeywords) {
        if (!kw) continue;
        const lowerKw = kw.toLowerCase();
        if (lowerInput.includes(lowerKw)) score += 5;
        // Check partial match
        const words = lowerInput.split(' ');
        for (const word of words) {
          if (word.length > 1 && (lowerKw.includes(word) || word.includes(lowerKw))) {
            score += 1.5;
          }
        }
      }
      return score;
    };

    // Evaluate all SN capabilities
    for (const item of capabilityDb.SN) {
      if (item.enabled === false) continue;
      const score = getMatchScore(text, item, 'SN');
      const isToFCode = item.code.startsWith("SN-A");
      
      if (isToFCode && !isToFTrigger && score < 15) continue;
      if (!isToFCode && !isCameraTrigger && score < 15) continue;
      
      if (score >= 5.0) matchedSN.push({ code: item.code, score: score });
    }

    // Evaluate MP
    for (const item of capabilityDb.MP) {
      if (item.enabled === false) continue;
      const score = getMatchScore(text, item, 'MP');
      if (score >= 6.0) matchedMP.push({ code: item.code, score: score });
    }

    // Evaluate PJ 
    const isProjectionNeeded = ["빔", "투사", "화면", "스크린", "보여", "표시", "영상", "이미지", "빛", "조명", "벽", "테이블"].some(w => text.includes(w));
    for (const item of capabilityDb.PJ) {
      if (item.enabled === false) continue;
      const score = getMatchScore(text, item, 'PJ');
      // Require projection trigger unless highly matched
      if (!isProjectionNeeded && score < 18) continue;
      if (score >= 6.0) matchedPJ.push({ code: item.code, score: score });
    }

    // Evaluate SP 
    const isSpeakerNeeded = ["소리", "음성", "말하", "말했", "음악", "효과음", "노래", "사운드", "안내", "말해", "대답", "목소리", "톤"].some(w => text.includes(w));
    for (const item of capabilityDb.SP) {
      if (item.enabled === false) continue;
      const score = getMatchScore(text, item, 'SP');
      // Require speaker trigger unless highly matched
      if (!isSpeakerNeeded && score < 18) continue;
      if (score >= 6.0) matchedSP.push({ code: item.code, score: score });
    }

    const sortAndFormat = (items, labelKo, labelEn) => {
      // Sort desc, remove duplicates, take top 3
      const unique = [];
      const seen = new Set();
      items.sort((a, b) => b.score - a.score).forEach(item => {
        if (!seen.has(item.code)) {
          seen.add(item.code);
          unique.push(item);
        }
      });

      return unique.slice(0, 3).map(item => ({
        code: item.code,
        reason: useEng ? \`Activated due to trigger matching \${labelEn}.\` : \`상황 인풋 분석 결과 \${labelKo} 거동에 부합함.\`
      }));
    };

    let finalSN = sortAndFormat(matchedSN, "센서 감지", "sensing trigger");
    if (finalSN.length === 0) {
      if (isToFTrigger) {
        finalSN = [{ code: "SN-A01", reason: "물리적 거리/접근 센서 선행 작동" }];
      } else if (isCameraTrigger) {
        finalSN = [{ code: "SN-B01", reason: "시각 인식을 위한 카메라 센서 선행 작동" }];
      }
    }

    const missingIntent = text.length < 8;
    const summaryText = useEng 
      ? \`Estimated capabilities match for: "\${text.substring(0, 15)}\${text.length > 15 ? '...' : ''}"\`
      : \`입력 상황 "\${text.substring(0, 15)}\${text.length > 15 ? '...' : ''}"에 대한 최적 추정 매칭 결과\`;

    const intentNoteText = missingIntent 
      ? (useEng ? "Provide explicit triggers and robot emotions to improve matching." : "구체적인 트리거와 로봇의 감정을 명시하면 더 명확해요.")
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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const startIndex = content.indexOf('  const translateToEn = (text) => {');
  let endIndex = -1;
  if (file.includes('server.js')) {
    endIndex = content.indexOf('app.post(\'/api/match\', async (req, res) => {');
  } else {
    endIndex = content.indexOf('  const apiKey = process.env.ANTHROPIC_API_KEY;');
  }
  
  if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + replacement + '\n' + (file.includes('server.js') ? '\n' : '') + content.substring(endIndex);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Failed to find markers in ${file}`);
  }
}
