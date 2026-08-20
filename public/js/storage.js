// 영업 백서 보관함 모듈
const StorageManager = {
    STORAGE_KEY: 'bias_archive_items',
  
    getItems() {
      try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      } catch (e) {
        console.error('Failed to load storage:', e);
        return [];
      }
    },
  
    saveItem(item) {
      const items = this.getItems();
      const newItem = {
        id: Date.now(),
        date: new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' }),
        ...item
      };
      items.unshift(newItem);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      return newItem;
    },
  
    deleteItem(id) {
      let items = this.getItems();
      items = items.filter(item => item.id !== Number(id));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    },
  
    clearAll() {
      localStorage.removeItem(this.STORAGE_KEY);
    },
  
    renderStorageList(containerId) {
      const container = document.getElementById(containerId);
      if (!container) return;
  
      const items = this.getItems();
      if (items.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <p>보관함에 저장된 입덕 백서가 없습니다. 💖</p>
          </div>
        `;
        return;
      }
  
      container.innerHTML = items.map(item => `
        <div class="saved-card fade-in" data-id="${item.id}">
          <div>
            <div class="saved-card-title">🎀 ${item.biasName}</div>
            <div class="saved-card-date">${item.date}</div>
            <p style="font-size:0.85rem; color:var(--text-sub); line-height:1.4; max-height:80px; overflow:hidden; text-overflow:ellipsis;">
              ${item.content.substring(0, 110)}...
            </p>
          </div>
          <div class="saved-card-actions">
            <button class="y2k-btn sub-btn view-btn" style="font-size:0.8rem; padding:4px 10px;" data-id="${item.id}">보기</button>
            <button class="y2k-btn danger-btn del-btn" style="font-size:0.8rem; padding:4px 10px;" data-id="${item.id}">삭제</button>
          </div>
        </div>
      `).join('');
    }
  };