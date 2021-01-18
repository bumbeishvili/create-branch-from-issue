// ==UserScript==
// @author       https://twitter.com/dbumbeishvili
// @name         Github - Create branch from issue
// @namespace    http://tampermonkey.net/
// @source       https://github.com/bumbeishvili/create-branch-from-issue
// @version      0.1
// @description  Creating same named branch from github issue
// @match        https://github.com/*/issues/*
// @grant        none
// ==/UserScript==

function stringToSlug(str) {
	str = str.replace(/^\s+|\s+$/g, ''); // trim
	str = str.toLowerCase();
	const fromLetter = 'şğàáäâèéëêìíïîòóöôùúüûñç·/_,:;';
	const toLetter = 'sgaaaaeeeeiiiioooouuuunc------';
	for (let i = 0, l = fromLetter.length; i < l; i++) {
		str = str.replace(new RegExp(fromLetter.charAt(i), 'g'), toLetter.charAt(i));
	}
	str = str
		.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
		.replace(/\s+/g, '-') // collapse whitespace and replace by -
		.replace(/-+/g, '-'); // collapse dashes
	return str;
}

(function () {
	'use strict';

	// If not header actions element presented, return since this is not an issue
	if (!document.querySelector('.gh-header-actions')) return;

	const $button = document.createElement('div');
	$button.innerHTML =
		'<button id="create_branch_button" style="margin-right:10px!important;background-color:#0C61FE" class="d-inline-block float-none m-0 mr-md-0 btn btn-sm btn-primary ">Create Branch From This Issue</button>';

	document.querySelector('.gh-header-actions').prepend($button);

	// Define branch list and base branch
	let branch = 'main';
	const repoUrl = window.location.href.split('issues')[0];

	// Update branch lists
	fetch(`${repoUrl}/branches`)
		.then((d) => d.text())
		.then((d) => {
			const $el = document.createElement('div')
			$el.innerHTML = d
			branch = $el.querySelector('branch-filter-item').getAttribute('branch')
		})
	// Issue new branch creation command
	function _createSameNamedBranchFromGithubIssue() {
		const issueTitle = document.querySelector('.js-issue-title').innerText;
		const issueId = window.location.pathname.split('/').pop();
		const branchTitle = stringToSlug(`issue ${issueId}-${issueTitle}`);

		fetch(`${repoUrl}refs/${branch}?source_action=disambiguate&source_controller=files`)
			.then((d) => d.text())
			.then((d) => {
				const $el = document.createElement('div')
				$el.innerHTML = d
				const $form = $el.querySelector('form')
				const $name = $form.querySelector('#name');
				$name.value = branchTitle;
				document.body.appendChild($form);
				debugger;
				// $form.submit()
			})
	}

	// Attach event to button
	$button.addEventListener('click', (d) => {
		_createSameNamedBranchFromGithubIssue();
	});
})();
