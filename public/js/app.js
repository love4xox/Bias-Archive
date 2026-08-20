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
                  bias_name: biasName,
                  friend_taste: friendTaste,
                  focus_points: selectedChips
              })
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.error || '생성에 실패했습니다.');
          }

          const guideText = data.guide || data.result || data.message || '';
          resultBiasTitle.innerText = `${biasName} 입덕 가이드`;

          if (window.marked) {
              resultContent.innerHTML = marked.parse(guideText);
          } else {
              resultContent.innerHTML = guideText.replace(/\n/g, '<br>');
          }

          currentGuide = {
              id: Date.now().toString(),
              biasName: biasName,
              friendTaste: friendTaste,
              focusPoints: selectedChips,
              content: guideText,
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