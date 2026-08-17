    (() => {
      // TokenHub smart-routing visual report, RFC v0.2.
      const root = document.documentElement;
      const saved = localStorage.getItem('tokenhub-report-theme');
      const preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.dataset.theme = saved || preferred;

      const themeBtn = document.getElementById('themeBtn');
      themeBtn.addEventListener('click', () => {
        const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
        root.dataset.theme = next;
        localStorage.setItem('tokenhub-report-theme', next);
      });

      document.getElementById('printBtn').addEventListener('click', () => window.print());

      const progress = document.getElementById('progress');
      const updateProgress = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const value = max > 0 ? (window.scrollY / max) * 100 : 0;
        progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
      };
      document.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();

      document.querySelectorAll('.copy-btn').forEach((button) => {
        button.addEventListener('click', async () => {
          const code = button.nextElementSibling?.innerText || '';
          try {
            await navigator.clipboard.writeText(code);
            const old = button.textContent;
            button.textContent = '已复制';
            setTimeout(() => button.textContent = old, 1200);
          } catch (_) {
            button.textContent = '复制失败';
          }
        });
      });

      const links = [...document.querySelectorAll('#tocNav a')];
      const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
        });
      }, { rootMargin: '-18% 0px -68% 0px', threshold: 0 });
      sections.forEach(section => observer.observe(section));

      const mobileToc = document.getElementById('mobileToc');
      mobileToc.addEventListener('change', () => {
        if (mobileToc.value) document.querySelector(mobileToc.value)?.scrollIntoView({ behavior: 'smooth' });
      });

      const diagramModal = document.getElementById('diagramModal');
      const diagramModalBody = document.getElementById('diagramModalBody');
      const diagramModalTitle = document.getElementById('diagramModalTitle');
      const closeDiagramModal = () => {
        diagramModal.hidden = true;
        diagramModalBody.innerHTML = '';
        document.body.classList.remove('modal-open');
      };
      document.querySelectorAll('[data-diagram-zoom]').forEach((button) => {
        button.addEventListener('click', () => {
          const card = button.closest('.diagram-card');
          const svg = card?.querySelector('svg');
          const title = card?.querySelector('.diagram-head strong')?.textContent || '图表大图';
          if (!svg) return;
          const clone = svg.cloneNode(true);
          clone.removeAttribute('width');
          clone.removeAttribute('height');
          diagramModalTitle.textContent = title;
          diagramModalBody.innerHTML = '';
          diagramModalBody.appendChild(clone);
          diagramModal.hidden = false;
          document.body.classList.add('modal-open');
        });
      });
      diagramModal.querySelector('.diagram-modal-close').addEventListener('click', closeDiagramModal);
      diagramModal.addEventListener('click', (event) => {
        if (event.target === diagramModal) closeDiagramModal();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !diagramModal.hidden) closeDiagramModal();
      });
    })();
