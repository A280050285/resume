/* ============================================
   李鑫盛的博客 - 交互脚本
   搜索 | 过滤 | 关键词云 | 统计看板 | 导航 | 动画
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ========== 存储文章数据 ==========
  const articles = Array.from(document.querySelectorAll('.work-card[data-keywords]'));

  // ========== 搜索功能 ==========
  const searchInput = document.getElementById('searchInput');
  const datePicker = document.getElementById('datePicker');
  const sortFilter = document.getElementById('sortFilter');
  const clearBtn = document.getElementById('clearSearch');
  const noResult = document.getElementById('noResult');
  const articlesGrid = document.getElementById('articlesGrid');

  function getArticleData(card) {
    return {
      el: card,
      title: (card.getAttribute('data-title') || '').toLowerCase(),
      keywords: (card.getAttribute('data-keywords') || '').toLowerCase(),
      date: card.getAttribute('data-date') || '',
      category: card.querySelector('.blog-category')?.textContent || ''
    };
  }

  function filterArticles() {
    const query = (searchInput?.value || '').toLowerCase().trim();
    const pickDate = datePicker?.value || '';
    let visibleCount = 0;

    articles.forEach(card => {
      const d = getArticleData(card);
      let match = true;

      if (query) {
        match = d.title.includes(query) || d.keywords.includes(query);
      }

      // 精确日期筛选
      if (pickDate && match) {
        match = d.date === pickDate;
      }

      if (match) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (sortFilter?.value === 'oldest') {
      const sorted = [...articles].sort((a, b) => getArticleData(a).date.localeCompare(getArticleData(b).date));
      sorted.forEach(card => articlesGrid.appendChild(card));
    } else {
      const sorted = [...articles].sort((a, b) => getArticleData(b).date.localeCompare(getArticleData(a).date));
      sorted.forEach(card => articlesGrid.appendChild(card));
    }

    if (noResult) noResult.style.display = visibleCount === 0 ? 'block' : 'none';
    updateStats();
  }

  searchInput?.addEventListener('input', filterArticles);
  datePicker?.addEventListener('change', filterArticles);
  sortFilter?.addEventListener('change', filterArticles);
  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (datePicker) datePicker.value = '';
    if (sortFilter) sortFilter.value = 'newest';
    filterArticles();
    resetTagCloud();
  });

  // ========== 关键词云 ==========
  const tagCloud = document.getElementById('tagCloud');
  let activeKeyword = 'all';

  tagCloud?.addEventListener('click', (e) => {
    const item = e.target.closest('.tag-cloud-item');
    if (!item) return;

    const keyword = item.dataset.keyword;
    activeKeyword = keyword;

    tagCloud.querySelectorAll('.tag-cloud-item').forEach(el => el.classList.remove('tag-active'));
    item.classList.add('tag-active');

    if (searchInput && keyword !== 'all') {
      searchInput.value = keyword;
    } else if (searchInput) {
      searchInput.value = '';
    }
    if (datePicker) datePicker.value = '';

    filterByKeywordDirect(keyword);
  });

  // 悬停气泡：高亮对应文章
  tagCloud?.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.tag-cloud-item');
    if (!item) return;
    const keyword = item.dataset.keyword;
    if (!keyword || keyword === 'all') return;

    articles.forEach(card => {
      if (card.classList.contains('hidden')) return;
      if (getArticleData(card).keywords.includes(keyword.toLowerCase())) {
        card.classList.add('highlighted');
      } else {
        card.classList.add('dimmed');
      }
    });
  });

  tagCloud?.addEventListener('mouseout', (e) => {
    const item = e.target.closest('.tag-cloud-item');
    if (!item) return;
    articles.forEach(card => {
      card.classList.remove('highlighted', 'dimmed');
    });
  });

  function filterByKeywordDirect(keyword) {
    if (keyword === 'all') {
      articles.forEach(card => card.classList.remove('hidden'));
      if (noResult) noResult.style.display = 'none';
      updateStats();
      return;
    }

    let visibleCount = 0;
    articles.forEach(card => {
      if (getArticleData(card).keywords.includes(keyword.toLowerCase())) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });
    if (noResult) noResult.style.display = visibleCount === 0 ? 'block' : 'none';
    updateStats();
  }

  function resetTagCloud() {
    activeKeyword = 'all';
    tagCloud?.querySelectorAll('.tag-cloud-item').forEach(el => {
      el.classList.remove('tag-active');
      if (el.dataset.keyword === 'all') el.classList.add('tag-active');
    });
  }

  // 全局函数：Hero 标签点击
  window.filterByKeyword = function(keyword) {
    if (searchInput) searchInput.value = keyword;
    if (datePicker) datePicker.value = '';
    activeKeyword = keyword;
    filterByKeywordDirect(keyword);
    document.getElementById('blog')?.scrollIntoView({ behavior: 'smooth' });
    tagCloud?.querySelectorAll('.tag-cloud-item').forEach(el => {
      el.classList.remove('tag-active');
      if (el.dataset.keyword === keyword) el.classList.add('tag-active');
    });
  };

  // ========== 统计看板 ==========
  function updateStats() {
    const allArts = articles;

    setStat('totalArticles', allArts.length);
    setStat('catDesign', countByCategory(allArts, '结构设计'));
    setStat('catSim', countByCategory(allArts, '仿真分析'));
    setStat('catTool', countByCategory(allArts, '工装设计'));
    setStat('catTrans', countByCategory(allArts, '精密传动'));
    setStat('catPart', countByCategory(allArts, '元器件选型'));

    // 动态更新关键词云大小
    updateTagCloudSizes(allArts);
  }

  function countByCategory(cards, cat) {
    return cards.filter(c => getArticleData(c).keywords.includes(cat.toLowerCase())).length;
  }

  function setStat(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ========== 关键词云动态大小 ==========
  function updateTagCloudSizes(allArts) {
    const items = tagCloud?.querySelectorAll('.tag-cloud-item');
    if (!items) return;

    const counts = {};
    items.forEach(item => {
      const kw = item.dataset.keyword;
      if (!kw || kw === 'all') return;
      counts[kw] = countByCategory(allArts, kw);
    });

    const maxCount = Math.max(...Object.values(counts), 1);

    items.forEach(item => {
      const kw = item.dataset.keyword;
      if (!kw || kw === 'all') return;

      item.classList.remove('tag-xl', 'tag-lg', 'tag-md', 'tag-sm', 'tag-active');

      const count = counts[kw] || 0;
      const ratio = count / maxCount;

      if (ratio >= 0.75) item.classList.add('tag-xl');
      else if (ratio >= 0.5) item.classList.add('tag-lg');
      else if (ratio >= 0.25) item.classList.add('tag-md');
      else item.classList.add('tag-sm');

      // 显示数量
      const txt = item.textContent.replace(/\s*\(\d+\)\s*$/, '');
      item.textContent = txt;
    });

    // 全部按钮
    const allBtn = tagCloud.querySelector('[data-keyword="all"]');
    if (allBtn) {
      allBtn.textContent = '全部';
      if (activeKeyword === 'all') allBtn.classList.add('tag-active');
    }
  }

  // ========== 导航栏滚动效果 ==========
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 20);
  });

  // ========== 移动端菜单 ==========
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  menuToggle?.addEventListener('click', () => navLinks?.classList.toggle('open'));
  navLinks?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks?.classList.remove('open'));
  });

  // ========== 导航高亮 ==========
  const sections = document.querySelectorAll('section[id], header[id]');
  const navItems = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) {
        current = section.getAttribute('id');
      }
    });
    navItems.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) link.classList.add('active');
    });
  });

  // ========== 滚动渐入动画 ==========
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.work-card, .stats-card, .tag-cloud-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // ========== 平滑滚动 ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ========== 初始化统计 ==========
  updateStats();

});
