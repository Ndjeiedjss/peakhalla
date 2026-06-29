(() => {
  const arenaProfilePath = location.pathname.match(/^\/arena\/profile\/([^/]+)\/?$/);
  if (!/^\/arena(?:\/profile\/[^/]+)?\/?$/.test(location.pathname)) return;

  Object.assign(translations.en, {
    arenaMyProfile: 'My profile', arenaProfileEyebrow: 'PLAYER PROFILE', arenaNoBio: 'No bio yet.',
    arenaEditProfile: 'EDIT PROFILE', arenaProfileCustomize: 'Make it yours', arenaChangePhoto: 'Change profile photo',
    arenaAvatarLimit: 'PNG, JPG, or WebP · up to 2 MB', arenaBio: 'Bio', arenaBioPlaceholder: 'Tell the arena who you are...',
    arenaRemovePhoto: 'Remove photo', arenaSaveProfile: 'Save profile', arenaProfileSaved: 'Profile saved.',
    arenaPostsCount: 'Posts', arenaCommentsCount: 'Comments', arenaMemberSince: 'Member since', arenaEdit: 'Edit', arenaDelete: 'Delete',
    arenaSave: 'Save', arenaCancel: 'Cancel', arenaLike: 'Like', arenaDislike: 'Dislike', arenaEdited: 'Edited',
    arenaDeletePostConfirm: 'Delete this screenshot permanently?', arenaDeleteCommentConfirm: 'Delete this comment?'
  });
  Object.assign(translations.ar, {
    arenaMyProfile: 'ملفي', arenaProfileEyebrow: 'ملف اللاعب', arenaNoBio: 'ما كتب بايو للحين.',
    arenaEditProfile: 'تعديل الملف', arenaProfileCustomize: 'خلّه يشبهك', arenaChangePhoto: 'غيّر صورة الحساب',
    arenaAvatarLimit: 'PNG أو JPG أو WebP · حتى 2 ميجا', arenaBio: 'البايو', arenaBioPlaceholder: 'عرّف أهل الساحة عنك...',
    arenaRemovePhoto: 'حذف الصورة', arenaSaveProfile: 'حفظ الملف', arenaProfileSaved: 'تم حفظ الملف.',
    arenaPostsCount: 'منشورات', arenaCommentsCount: 'تعليقات', arenaMemberSince: 'عضو من', arenaEdit: 'تعديل', arenaDelete: 'حذف',
    arenaSave: 'حفظ', arenaCancel: 'إلغاء', arenaLike: 'إعجاب', arenaDislike: 'عدم إعجاب', arenaEdited: 'تم التعديل',
    arenaDeletePostConfirm: 'تحذف الصورة نهائيًا؟', arenaDeleteCommentConfirm: 'تحذف التعليق؟'
  });

  state.arenaProfile = null;
  state.arenaProfileAvatarData = null;
  state.arenaRemoveAvatar = false;

  const ui = {
    profileButton: document.querySelector('#arena-profile-button'),
    modal: document.querySelector('#arena-profile-modal'),
    avatar: document.querySelector('#arena-profile-avatar'),
    name: document.querySelector('#arena-profile-name'),
    bio: document.querySelector('#arena-profile-bio'),
    stats: document.querySelector('#arena-profile-stats'),
    form: document.querySelector('#arena-profile-form'),
    avatarInput: document.querySelector('#arena-profile-avatar-input'),
    photoPreview: document.querySelector('#arena-profile-photo-preview'),
    bioInput: document.querySelector('#arena-profile-bio-input'),
    removeAvatar: document.querySelector('#arena-profile-remove-avatar'),
    save: document.querySelector('#arena-profile-save'),
    status: document.querySelector('#arena-profile-status')
  };

  const userShape = (value) => value && typeof value === 'object' ? value : { username: String(value || 'Player'), avatar_url: null, bio: '' };
  const avatarInner = (value) => {
    const user = userShape(value);
    const name = user.username || 'Player';
    return user.avatar_url
      ? `<img src="${escapeHtml(user.avatar_url)}" alt="${escapeHtml(name)}" loading="lazy">`
      : escapeHtml(initials(name).slice(0, 1));
  };
  const avatarMarkup = (value, className = 'arena-comment-avatar') => `<span class="${className}">${avatarInner(value)}</span>`;
  const authorButton = (author = {}) => {
    const user = userShape(author);
    return `<button type="button" class="arena-author-link" data-v72-profile="${escapeHtml(user.username || '')}">${avatarMarkup(user)}<span><strong>${escapeHtml(user.username || 'Player')}</strong>${user.bio ? `<small>${escapeHtml(user.bio)}</small>` : ''}</span></button>`;
  };
  const ownerActions = (kind, postId, itemId = '') => `<div class="arena-owner-actions"><button type="button" data-v72-edit-${kind}="${escapeHtml(postId)}"${itemId ? ` data-comment-id="${escapeHtml(itemId)}"` : ''}>${escapeHtml(t('arenaEdit'))}</button><button type="button" class="danger" data-v72-delete-${kind}="${escapeHtml(postId)}"${itemId ? ` data-comment-id="${escapeHtml(itemId)}"` : ''}>${escapeHtml(t('arenaDelete'))}</button></div>`;

  window.renderArenaAccount = function renderArenaAccountV72() {
    const loggedIn = Boolean(state.arenaUser);
    if (els.arenaAuthPanel) els.arenaAuthPanel.hidden = loggedIn;
    if (els.arenaComposer) els.arenaComposer.hidden = !loggedIn;
    if (!loggedIn) return;
    els.arenaCurrentUser.textContent = state.arenaUser.username;
    els.arenaUserAvatar.innerHTML = avatarInner(state.arenaUser);
  };

  const renderComment = (comment, replies, postId) => `<article class="arena-comment" data-v72-comment-id="${escapeHtml(comment.id)}">
    ${avatarMarkup(comment.author || comment.username)}
    <div class="arena-comment-body">
      <header><button type="button" class="arena-comment-user" data-v72-profile="${escapeHtml(comment.username)}"><strong>${escapeHtml(comment.username)}</strong></button><span><time>${escapeHtml(arenaDate(comment.created_at))}</time>${comment.updated_at ? `<span class="arena-edited">${escapeHtml(t('arenaEdited'))}</span>` : ''}</span></header>
      <p data-v72-comment-text>${escapeHtml(comment.text)}</p>
      <div class="arena-comment-actions">${state.arenaUser ? `<button type="button" class="arena-reply-button" data-arena-reply-id="${escapeHtml(comment.id)}" data-arena-reply-user="${escapeHtml(comment.username)}">${escapeHtml(t('arenaReply'))}</button>` : ''}${comment.is_owner ? ownerActions('comment', postId, comment.id) : ''}</div>
      ${replies.length ? `<div class="arena-replies">${replies.map((reply) => `<article class="arena-comment arena-comment-reply" data-v72-comment-id="${escapeHtml(reply.id)}">${avatarMarkup(reply.author || reply.username)}<div class="arena-comment-body"><header><button type="button" class="arena-comment-user" data-v72-profile="${escapeHtml(reply.username)}"><strong>${escapeHtml(reply.username)}</strong></button><span><time>${escapeHtml(arenaDate(reply.created_at))}</time>${reply.updated_at ? `<span class="arena-edited">${escapeHtml(t('arenaEdited'))}</span>` : ''}</span></header><p data-v72-comment-text>${escapeHtml(reply.text)}</p>${reply.is_owner ? `<div class="arena-comment-actions">${ownerActions('comment', postId, reply.id)}</div>` : ''}</div></article>`).join('')}</div>` : ''}
    </div>
  </article>`;

  window.renderArenaPost = function renderArenaPostV72(post, index) {
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const parents = comments.filter((comment) => !comment.parent_id);
    const replyMap = new Map();
    comments.filter((comment) => comment.parent_id).forEach((comment) => {
      const list = replyMap.get(comment.parent_id) || [];
      list.push(comment);
      replyMap.set(comment.parent_id, list);
    });
    const reactions = post.reactions || { likes: 0, dislikes: 0, viewer_reaction: null };
    const commentForm = state.arenaUser
      ? `<form class="arena-comment-form" data-arena-post-id="${escapeHtml(post.id)}"><div class="arena-replying" hidden><span></span><button type="button" data-arena-cancel-reply>×</button></div><input type="hidden" name="parent_id"><input name="text" maxlength="500" autocomplete="off" placeholder="${escapeHtml(t('arenaWriteComment'))}" required><button type="submit">${escapeHtml(t('arenaSend'))}</button></form>`
      : `<p class="arena-signin-note">${escapeHtml(t('arenaSignInToComment'))}</p>`;
    return `<article id="arena-post-${escapeHtml(post.id)}" class="arena-post panel" data-v72-post-id="${escapeHtml(post.id)}" style="--arena-delay:${Math.min(index, 10) * 55}ms">
      <header class="arena-post-header">${authorButton(post.author || post.username)}<div class="arena-post-header-meta"><time>${escapeHtml(arenaDate(post.created_at))}</time>${post.updated_at ? `<span class="arena-edited">${escapeHtml(t('arenaEdited'))}</span>` : ''}${post.is_owner ? ownerActions('post', post.id) : ''}</div></header>
      <div class="arena-post-image"><img src="${escapeHtml(post.image_url)}" alt="Screenshot shared by ${escapeHtml(post.username)}" loading="lazy"></div>
      <div class="arena-post-caption-wrap"><p class="arena-post-caption ${post.caption ? '' : 'arena-empty-caption'}" data-v72-caption>${post.caption ? escapeHtml(post.caption) : '—'}</p></div>
      <div class="arena-post-socialbar"><div class="arena-reactions"><button type="button" class="${reactions.viewer_reaction === 'like' ? 'active' : ''}" data-v72-reaction="like" data-post-id="${escapeHtml(post.id)}"><span>♡</span><b>${number(reactions.likes, '0')}</b><small>${escapeHtml(t('arenaLike'))}</small></button><button type="button" class="${reactions.viewer_reaction === 'dislike' ? 'active dislike' : ''}" data-v72-reaction="dislike" data-post-id="${escapeHtml(post.id)}"><span>↓</span><b>${number(reactions.dislikes, '0')}</b><small>${escapeHtml(t('arenaDislike'))}</small></button></div><span class="arena-comment-total">${number(comments.length, '0')} ${escapeHtml(t('arenaComments'))}</span></div>
      <section class="arena-comments"><header><strong>${escapeHtml(t('arenaComments'))}</strong><span>${number(comments.length, '0')}</span></header><div class="arena-comment-list">${parents.map((comment) => renderComment(comment, replyMap.get(comment.id) || [], post.id)).join('')}</div>${commentForm}</section>
    </article>`;
  };

  window.renderArenaPosts = function renderArenaPostsV72() {
    if (!els.arenaFeed) return;
    if (!state.arenaPosts.length) {
      els.arenaFeed.innerHTML = `<div class="arena-empty panel"><span>▧</span><strong>${escapeHtml(t('arenaNoPosts'))}</strong></div>`;
      return;
    }
    els.arenaFeed.innerHTML = state.arenaPosts.map(window.renderArenaPost).join('');
  };

  const replacePost = (post) => {
    const index = state.arenaPosts.findIndex((item) => item.id === post.id);
    if (index >= 0) state.arenaPosts[index] = post;
    else state.arenaPosts.unshift(post);
    window.renderArenaPosts();
  };

  const requireLogin = () => {
    if (state.arenaUser) return true;
    els.arenaAuthPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setArenaFormStatus(els.arenaAuthStatus, t('arenaSignInToComment'), 'error');
    return false;
  };

  const closeProfile = () => {
    ui.modal.hidden = true;
    document.body.classList.remove('arena-profile-open');
    state.arenaProfileAvatarData = null;
    state.arenaRemoveAvatar = false;
    if (/^\/arena\/profile\//.test(location.pathname)) history.pushState({}, '', '/arena');
  };

  const profileAvatar = (profile) => profile.avatar_url ? `<img src="${escapeHtml(profile.avatar_url)}" alt="${escapeHtml(profile.username)}">` : `<span>${escapeHtml(initials(profile.username || 'P').slice(0, 1))}</span>`;
  const renderProfile = (profile) => {
    state.arenaProfile = profile;
    ui.name.textContent = profile.username || 'Player';
    ui.bio.textContent = profile.bio || t('arenaNoBio');
    ui.avatar.innerHTML = profileAvatar(profile);
    ui.stats.innerHTML = `<article><span>${escapeHtml(t('arenaPostsCount'))}</span><strong>${number(profile.post_count || 0)}</strong></article><article><span>${escapeHtml(t('arenaCommentsCount'))}</span><strong>${number(profile.comment_count || 0)}</strong></article><article><span>${escapeHtml(t('arenaMemberSince'))}</span><strong>${escapeHtml(shortDate(profile.created_at))}</strong></article>`;
    const own = Boolean(state.arenaUser && normalize(state.arenaUser.username) === normalize(profile.username));
    ui.form.hidden = !own;
    if (own) {
      ui.bioInput.value = profile.bio || '';
      ui.photoPreview.innerHTML = profileAvatar(profile);
      setArenaFormStatus(ui.status);
    }
  };
  const openProfile = async (username, options = {}) => {
    if (!username) return;
    if (options.updateUrl !== false) history.pushState({}, '', `/arena/profile/${encodeURIComponent(username)}`);
    ui.modal.hidden = false;
    document.body.classList.add('arena-profile-open');
    ui.name.textContent = username;
    ui.bio.textContent = t('arenaLoading');
    ui.stats.innerHTML = '<div class="arena-profile-loading"></div>';
    ui.form.hidden = true;
    try {
      const data = await arenaRequest(`/api/arena/profiles/${encodeURIComponent(username)}`);
      renderProfile(data.profile || {});
    } catch (error) {
      ui.bio.textContent = error.message;
      ui.stats.innerHTML = '';
    }
  };

  const readImageFile = (file, maxBytes, label = 'Image') => new Promise((resolve, reject) => {
    if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return reject(new Error('Choose a PNG, JPG, or WebP image.'));
    if (file.size > maxBytes) return reject(new Error(`${label} must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
  const readAvatar = (file) => readImageFile(file, 2 * 1024 * 1024, 'Avatar');

  const beginPostEdit = (button) => {
    const article = button.closest('[data-v72-post-id]');
    const postId = article?.dataset.v72PostId;
    const post = state.arenaPosts.find((item) => item.id === postId);
    const wrap = article?.querySelector('.arena-post-caption-wrap');
    if (!post || !wrap) return;
    wrap.innerHTML = `<form class="arena-inline-editor" data-v72-post-edit="${escapeHtml(postId)}"><textarea maxlength="500" rows="3">${escapeHtml(post.caption || '')}</textarea><label class="arena-replace-image"><input type="file" accept="image/png,image/jpeg,image/webp"><span>Replace screenshot <small>optional · max 5 MB</small></span></label><div><button type="button" class="arena-ghost-button" data-v72-cancel-edit>${escapeHtml(t('arenaCancel'))}</button><button type="submit" class="arena-mini-primary">${escapeHtml(t('arenaSave'))}</button></div></form>`;
    wrap.querySelector('textarea')?.focus();
  };
  const beginCommentEdit = (button) => {
    const article = button.closest('[data-v72-comment-id]');
    const postArticle = button.closest('[data-v72-post-id]');
    const postId = postArticle?.dataset.v72PostId;
    const commentId = button.dataset.commentId;
    const post = state.arenaPosts.find((item) => item.id === postId);
    const comment = post?.comments?.find((item) => item.id === commentId);
    const textNode = article?.querySelector('[data-v72-comment-text]');
    if (!comment || !textNode) return;
    textNode.outerHTML = `<form class="arena-inline-editor arena-comment-editor" data-v72-comment-edit="${escapeHtml(commentId)}" data-post-id="${escapeHtml(postId)}"><textarea maxlength="500" rows="3">${escapeHtml(comment.text)}</textarea><div><button type="button" class="arena-ghost-button" data-v72-cancel-edit>${escapeHtml(t('arenaCancel'))}</button><button type="submit" class="arena-mini-primary">${escapeHtml(t('arenaSave'))}</button></div></form>`;
    article.querySelector('textarea')?.focus();
  };

  ui.profileButton?.addEventListener('click', () => state.arenaUser && openProfile(state.arenaUser.username));
  document.querySelectorAll('[data-arena-profile-close]').forEach((button) => button.addEventListener('click', closeProfile));
  ui.avatarInput?.addEventListener('change', async () => {
    try {
      state.arenaProfileAvatarData = await readAvatar(ui.avatarInput.files?.[0]);
      state.arenaRemoveAvatar = false;
      ui.photoPreview.innerHTML = `<img src="${escapeHtml(state.arenaProfileAvatarData)}" alt="Preview">`;
      setArenaFormStatus(ui.status);
    } catch (error) {
      setArenaFormStatus(ui.status, error.message, 'error');
    }
  });
  ui.removeAvatar?.addEventListener('click', () => {
    state.arenaProfileAvatarData = null;
    state.arenaRemoveAvatar = true;
    ui.avatarInput.value = '';
    ui.photoPreview.innerHTML = `<span>${escapeHtml(initials(state.arenaUser?.username || 'P').slice(0, 1))}</span>`;
  });
  ui.form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      ui.save.disabled = true;
      const data = await arenaRequest('/api/arena/profile', { method: 'PATCH', body: JSON.stringify({ bio: ui.bioInput.value.trim(), avatar_data: state.arenaProfileAvatarData, remove_avatar: state.arenaRemoveAvatar }) });
      state.arenaUser = data.user;
      window.dispatchEvent(new CustomEvent('arena-account-changed', { detail: { user: data.user } }));
      state.arenaProfileAvatarData = null;
      state.arenaRemoveAvatar = false;
      window.renderArenaAccount();
      setArenaFormStatus(ui.status, t('arenaProfileSaved'), 'success');
      await loadArenaPosts({ silent: true });
      await openProfile(data.user.username);
    } catch (error) {
      setArenaFormStatus(ui.status, error.message, 'error');
    } finally {
      ui.save.disabled = false;
    }
  });

  els.arenaFeed?.addEventListener('click', async (event) => {
    const profile = event.target.closest('[data-v72-profile]');
    if (profile) { event.preventDefault(); openProfile(profile.dataset.v72Profile); return; }
    const reaction = event.target.closest('[data-v72-reaction]');
    if (reaction) {
      event.preventDefault();
      if (!requireLogin()) return;
      try {
        const data = await arenaRequest(`/api/arena/posts/${encodeURIComponent(reaction.dataset.postId)}/reaction`, { method: 'POST', body: JSON.stringify({ reaction: reaction.dataset.v72Reaction }) });
        replacePost(data.post);
      } catch (error) { window.alert(error.message); }
      return;
    }
    const editPost = event.target.closest('[data-v72-edit-post]');
    if (editPost) { beginPostEdit(editPost); return; }
    const deletePost = event.target.closest('[data-v72-delete-post]');
    if (deletePost) {
      if (!window.confirm(t('arenaDeletePostConfirm'))) return;
      try {
        await arenaRequest(`/api/arena/posts/${encodeURIComponent(deletePost.dataset.v72DeletePost)}`, { method: 'DELETE' });
        state.arenaPosts = state.arenaPosts.filter((post) => post.id !== deletePost.dataset.v72DeletePost);
        window.renderArenaPosts();
      } catch (error) { window.alert(error.message); }
      return;
    }
    const editComment = event.target.closest('[data-v72-edit-comment]');
    if (editComment) { beginCommentEdit(editComment); return; }
    const deleteComment = event.target.closest('[data-v72-delete-comment]');
    if (deleteComment) {
      if (!window.confirm(t('arenaDeleteCommentConfirm'))) return;
      try {
        const data = await arenaRequest(`/api/arena/posts/${encodeURIComponent(deleteComment.dataset.v72DeleteComment)}/comments/${encodeURIComponent(deleteComment.dataset.commentId)}`, { method: 'DELETE' });
        replacePost(data.post);
      } catch (error) { window.alert(error.message); }
      return;
    }
    if (event.target.closest('[data-v72-cancel-edit]')) window.renderArenaPosts();
  }, true);

  els.arenaFeed?.addEventListener('submit', async (event) => {
    const postForm = event.target.closest('[data-v72-post-edit]');
    if (postForm) {
      event.preventDefault();
      const submit = postForm.querySelector('button[type="submit"]');
      try {
        submit.disabled = true;
        const replacement = postForm.querySelector('input[type="file"]')?.files?.[0];
        const imageData = replacement ? await readImageFile(replacement, 5 * 1024 * 1024, 'Screenshot') : null;
        const data = await arenaRequest(`/api/arena/posts/${encodeURIComponent(postForm.dataset.v72PostEdit)}`, { method: 'PATCH', body: JSON.stringify({ caption: postForm.querySelector('textarea').value.trim(), image_data: imageData }) });
        replacePost(data.post);
      } catch (error) { window.alert(error.message); }
      finally { submit.disabled = false; }
      return;
    }
    const commentForm = event.target.closest('[data-v72-comment-edit]');
    if (commentForm) {
      event.preventDefault();
      const submit = commentForm.querySelector('button[type="submit"]');
      try {
        submit.disabled = true;
        const data = await arenaRequest(`/api/arena/posts/${encodeURIComponent(commentForm.dataset.postId)}/comments/${encodeURIComponent(commentForm.dataset.v72CommentEdit)}`, { method: 'PATCH', body: JSON.stringify({ text: commentForm.querySelector('textarea').value.trim() }) });
        replacePost(data.post);
      } catch (error) { window.alert(error.message); }
      finally { submit.disabled = false; }
    }
  }, true);

  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !ui.modal.hidden) closeProfile(); });

  const revealRequestedPost = () => {
    if (!location.hash.startsWith('#arena-post-')) return;
    const target = document.querySelector(location.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('arena-post-highlight');
      window.setTimeout(() => target.classList.remove('arena-post-highlight'), 2200);
    }
  };

  applyLanguage();
  Promise.all([loadArenaUser(), loadArenaPosts({ silent: true })]).finally(() => {
    if (arenaProfilePath?.[1]) openProfile(decodeURIComponent(arenaProfilePath[1]), { updateUrl: false });
    window.setTimeout(revealRequestedPost, 120);
  });
})();
