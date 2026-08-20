document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const biasForm = document.getElementById('biasForm');
  const biasNameInput = document.getElementById('biasName');
  const friendTasteInput = document.getElementById('friendTaste');
  const submitBtn = document.getElementById('submitBtn');
  const loadingBox = document.getElementById('loadingBox');
  const resultBox = document.getElementById('resultBox');
  const resultContent = document.getElementById('resultContent');
  const resultBiasTitle = document.getElementById('resultBiasTitle');
  const saveBtn = document.getElementById('saveBtn');
  const shareLinkBtn = document.getElementById('shareLinkBtn');
  const chipButtons = document.querySelectorAll('.chip');

  let currentGuide = null;

  // 마크다운 특수문자 완벽 제거 및 줄바꿈/소제목 스타일 변환 함수
  function cleanAndFormatText(text) {
      if (!text) return '';

      // 1. 유튜브 태그 분리
      let cleanText = text.split('[YOUTUBE:')[0].trim();

      // 2. 구분선 (---) 제거 및 실선 추가
      cleanText = cleanText.replace(/^-{3,}$/gm, '<hr style="border:0; border-top:2px dashed #ff99cc; margin:16px 0;">');

      // 3. 제목 (#, ##, ###, ####) 기호 제거 후 소제목 스타일 적용
      cleanText = cleanText.replace(/^#{1,6}\s*(.*$)/gim, '<div style="font-size:1.1rem; font-weight:800; color:#ff4d8d; margin-top:18px; margin-bottom:8px;">$1</div>');

      // 4. 볼드체 별표 (**) 완전히 제거하고 보라색 강조 처리
      cleanText = cleanText.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#7928ca; font-weight:800;">$1</strong>');

      // 5. 불릿 포인트 (* 또는 -) 기호 제거 후 깔끔한 동그라미 처리
      cleanText = cleanText.replace(/^\s*[\*\-]\s*(.*$)/gim, '<div style="margin-left:6px; margin-bottom:4px;">✨ $1</div>');

      // 6. 줄바꿈을 <br>로 변경
      cleanText = cleanText.replace(/\n/g, '<br>');

      return cleanText;
  }

  tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
          const targetTab = btn.dataset.tab;
          tabButtons.forEach(b => b.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          btn.classList.add('active');
          const targetContent = document.getElementById(`tab-${targetTab}`);
          if (targetContent) targetContent.classList.add('active');

          if (targetTab === 'storage' && window.loadStorageItems) {
              window.loadStorageItems();
          }
          if (targetTab === 'youtube' && window.renderYoutubeLinks) {
              window.renderYoutubeLinks(currentGuide ? currentGuide.biasName : '');
          }
      });
  });

  chipButtons.forEach(chip => {
      chip.addEventListener('click', () => {
          chip.classList.toggle('active');
      });
  });

  biasForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const biasName = biasNameInput.value.trim();
      const friendTaste = friendTasteInput.value.trim();
      const selectedChips = Array.from(document.querySelectorAll('.chip.active')).map(c => c.dataset.val);

      if (!biasName || !friendTaste) return;

      submitBtn.disabled = true;
      loadingBox.style.display = 'block';
      resultBox.style.display = 'none';

      try {
          const response = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  biasName: biasName,
                  friendTaste: friendTaste,
                  focusPoints: selectedChips
              })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.error || '생성에 실패했습니다.');
          }

          const rawText = data.reply || data.guide || data.result || data.message || '';
          resultBiasTitle.innerText = `${biasName} 입덕 가이드`;

          // innerText가 아니라 innerHTML로 정제된 텍스트 주입
          resultContent.innerHTML = cleanAndFormatText(rawText);

          currentGuide = {
              id: Date.now().toString(),
              biasName: biasName,
              friendTaste: friendTaste,
              focusPoints: selectedChips,
              content: rawText,
              createdAt: new Date().toISOString()
          };

          resultBox.style.display = 'block';

          if (window.renderYoutubeLinks) {
              window.renderYoutubeLinks(biasName);
          }
      } catch (err) {
          alert(`오류: ${err.message}`);
      } finally {
          loadingBox.style.display = 'none';
          submitBtn.disabled = false;
      }
  });

  if (saveBtn) {
      saveBtn.addEventListener('click', () => {
          if (!currentGuide) return;
          if (window.saveToStorage) {
              window.saveToStorage(currentGuide);
              alert('영업 백서 보관함에 저장되었습니다!');
          }
      });
  }

  if (shareLinkBtn) {
      shareLinkBtn.addEventListener('click', async () => {
          if (!currentGuide || !currentGuide.content) return;
          try {
              await navigator.clipboard.writeText(currentGuide.content);
              alert('입덕 백서 내용이 클립보드에 복사되었습니다!');
          } catch (err) {
              alert('복사에 실패했습니다.');
          }
      });
  }
});