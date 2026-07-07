(() => {
  const dropdowns = [...document.querySelectorAll('[data-site-dropdown]')];

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.classList.remove('open');
    const toggle = dropdown.querySelector(':scope > .nav-dropdown-toggle');
    const menu = dropdown.querySelector(':scope > .nav-dropdown-menu');
    toggle?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-hidden', 'true');
  }

  function closeAll(except = null) {
    dropdowns.forEach((dropdown) => {
      if (dropdown !== except) closeDropdown(dropdown);
    });
  }

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(':scope > .nav-dropdown-toggle');
    const menu = dropdown.querySelector(':scope > .nav-dropdown-menu');
    if (!toggle || !menu) return;

    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const opening = !dropdown.classList.contains('open');
      closeAll(dropdown);
      dropdown.classList.toggle('open', opening);
      toggle.setAttribute('aria-expanded', String(opening));
      menu.setAttribute('aria-hidden', String(!opening));
    });

    menu.addEventListener('click', (event) => {
      if (event.target.closest('a, button')) closeDropdown(dropdown);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-site-dropdown]')) closeAll();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeAll();
  });
})();
