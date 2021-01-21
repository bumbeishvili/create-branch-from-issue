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
    const $loadingIndicator = document.createElement('div');
    $loadingIndicator.innerHTML = `<span id="span-issue-loading-branches" class="mr-1">Loading branches...</span>
    `;
    const $button = document.createElement('div');
    $button.innerHTML =
        '<button id="create_branch_button" style="margin-right:10px!important;background-color:#0C61FE" class="d-inline-block float-none m-0 mr-md-0 btn btn-sm btn-primary ">Create Branch From This Issue</button>';
    document.querySelector('.gh-header-actions').prepend($button);
    document.querySelector('.gh-header-actions').prepend($loadingIndicator);
    // Define branch list and base branch
    const repoUrl = window.location.href.split('issues')[0];
    // Update branch lists
    fetch(`${repoUrl}/branches/all`)
        .then((d) => d.text())
        .then((d) => {
            const $el = document.createElement('div');
            $el.innerHTML = d;
            const branchesFilterItems = $el.querySelectorAll('branch-filter-item');
            let branches = [];
            let options = [];
            branchesFilterItems.forEach(element => {
                const branch = element.getAttribute("branch");
                branches.push(branch)
                options.push(`<option value="${branch}">${branch}</option>`)
            })
            const $dropdown = document.createElement('div');
            $dropdown.innerHTML = `Source branch:
              <select class="form-control mr-1" id="dropdown-issue-all-branches">
                  ${options}
              </select>
            `
            document.querySelector('.gh-header-actions').prepend($dropdown); // Adds the branches dropdown into the DOM
            document.getElementById("span-issue-loading-branches").outerHTML = ""; // Removes the loading indicator from the DOM
        });
    // Attach event to button
    // Issue new branch creation command
    $button.addEventListener('click', (d) => {
        const issueTitle = document.querySelector('.js-issue-title').innerText;
        const issueId = window.location.pathname.split('/').pop();
        const branchTitle = stringToSlug(`issue ${issueId}-${issueTitle}`);
        // Selecting the source branch
        const dropdown = document.getElementById('dropdown-issue-all-branches');
        const selected = dropdown.options[dropdown.selectedIndex].text;
        let branch = 'main';
        if (selected) {
            branch = selected;
        }
        fetch(`${repoUrl}refs/${branch}?source_action=disambiguate&source_controller=files`)
            .then((d) => d.text())
            .then((d) => {
                const $el = document.createElement('div');
                $el.innerHTML = d;
                const $form = $el.querySelector('form');
                const $name = $form.querySelector('#name');
                $name.value = branchTitle;
                document.body.appendChild($form);
                $form.submit();
            });
    });
})();
