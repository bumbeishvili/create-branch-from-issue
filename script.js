// ==UserScript==
// @author       https://twitter.com/dbumbeishvili
// @name         Github - Create branch from issue
// @namespace    http://tampermonkey.net/
// @source       https://github.com/bumbeishvili/create-branch-from-issue
// @version      0.1
// @description  Creating same named branch from github issue
// @match        https://github.com/*/issues/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.5.0/jquery.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // If header actions element presented, add button
    if(document.querySelector('.gh-header-actions')){
           document.querySelector('.gh-header-actions')
.prepend(jQuery('<button id="create_branch_button" style="margin-right:10px!important;background-color:#0C61FE" class="d-inline-block float-none m-0 mr-md-0 btn btn-sm btn-primary ">Create Branch From This Issue</button>')[0])

    }else{
        return;
    }

    // Define branch list and base branch
    let branches = null;
    let branch = 'master';
    const repoUrl = window.location.href.split('issues')[0];

    // Update branch lists
    fetch(`${repoUrl}/branches`)
                    .then(d=>d.text())
                    .then(d=>jQuery(d).find('branch-filter-item'))
                    .then(d=>d.toArray())
                    .then(d=>d.map(v=>v.innerText.trim().split('\n')[0]))
                    .then(d=>{
                      console.log('Branches loaded',d)
                      branches = d;
                      branch = branches[0]
                    })
    // Issue new branch creation command
    function _createSameNamedBranchFromGithubIssue(){
       
        const issueTitle = document.querySelector('.js-issue-title').innerText;
        const branchTitle = issueTitle.split(' ').filter(d=>d.trim()).map(d=>d.toLowerCase()).join('-');

        fetch(`${repoUrl}refs/${branch}?source_action=disambiguate&source_controller=files`)
            .then(d=>d.text())
            .then(d=>jQuery(d))
            .then(d=>d.find('form')[0])
            .then(form=>{
            const name = form.querySelector('#name');
            jQuery(name).val(branchTitle);
            document.body.appendChild(form);
            jQuery(form).submit()
        })
            .then(d=>console.log(d))
    }

    // Attach event to button
    jQuery('#create_branch_button').click(d=>{
       _createSameNamedBranchFromGithubIssue()
    })

})();
