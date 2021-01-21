// ==UserScript==
// @author       https://twitter.com/dbumbeishvili
// @name         Github - Create branch from issue
// @namespace    http://tampermonkey.net/
// @source       https://github.com/bumbeishvili/create-branch-from-issue
// @version      0.1
// @description  Creating same named branch from github issue
// @match        https://github.com/*
// @grant        GM_openInTab
// ==/UserScript==

function stringToSlug(str) {
  str = str.replace(/^\s+|\s+$/g, ""); // trim
  str = str.toLowerCase();
  const fromLetter = "şğàáäâèéëêìíïîòóöôùúüûñç·/_,:;";
  const toLetter = "sgaaaaeeeeiiiioooouuuunc------";
  for (let i = 0, l = fromLetter.length; i < l; i++) {
    str = str.replace(
      new RegExp(fromLetter.charAt(i), "g"),
      toLetter.charAt(i)
    );
  }
  str = str
    .replace(/[^a-z0-9 -]/g, "") // remove invalid chars
    .replace(/\s+/g, "-") // collapse whitespace and replace by -
    .replace(/-+/g, "-"); // collapse dashes
  return str;
}
(function () {
  "use strict";
  if (window.location.href.match("/issues/*")) {
    // If not header actions element presented, return since this is not an issue
    if (!document.querySelector(".gh-header-actions")) return;
    const $loadingIndicator = document.createElement("div");
    $loadingIndicator.innerHTML = `<span id="span-issue-loading-branches" class="mr-1">Loading branches...</span>`;
    const $button = document.createElement("div");
    $button.innerHTML =
      '<button id="create_branch_button" style="margin-right:10px!important;background-color:#0C61FE" class="d-inline-block float-none m-0 mr-md-0 btn btn-sm btn-primary ">Create Branch From This Issue</button>';
    document.querySelector(".gh-header-actions").prepend($button);
    document.querySelector(".gh-header-actions").prepend($loadingIndicator);
    // Define branch list and base branch
    const repoUrl = window.location.href.split("issues")[0];
    // Update branch lists

    fetch(`${repoUrl}/branches/all`)
      .then((d) => d.text())
      .then((d) => {
        const $el = document.createElement("div");
        $el.innerHTML = d;
        const branchesFilterItems = $el.querySelectorAll("branch-filter-item");
        let options = [];
        branchesFilterItems.forEach((element) => {
          const branch = element.getAttribute("branch");
          options.push(`<option value="${branch}">${branch}</option>`);
        });

        const $dropdown = document.createElement("div");
        $dropdown.innerHTML = `Source branch:
              <select class="form-control mr-1" id="dropdown-issue-all-branches">
                  ${options}
              </select>
            `;
        document.querySelector(".gh-header-actions").prepend($dropdown); // Adds the branches dropdown into the DOM
        document.getElementById("span-issue-loading-branches").outerHTML = ""; // Removes the loading indicator from the DOM
      });
    // Attach event to button
    // Issue new branch creation command
    $button.addEventListener("click", (d) => {
      const issueTitle = document.querySelector(".js-issue-title").innerText;
      const issueId = window.location.pathname.split("/").pop();
      const branchTitle = stringToSlug(`issue ${issueId}-${issueTitle}`);

      // Selecting the source branch
      const dropdown = document.getElementById("dropdown-issue-all-branches");
      const selected = dropdown.options[dropdown.selectedIndex].text;

      let branch = "main";
      if (selected) {
        branch = selected;
      }

      fetch(
        `${repoUrl}refs/${branch}?source_action=disambiguate&source_controller=files`
      )
        .then((d) => d.text())
        .then((d) => {
          const $el = document.createElement("div");
          $el.innerHTML = d;
          const $form = $el.querySelector("form");
          const $name = $form.querySelector("#name");
          $name.value = branchTitle;
          document.body.appendChild($form);
          $form.submit();
        });
    });
  }
  return;
})();

(function () {
  if (window.location.href.match("/pull/*")) {
    const repoUrl = window.location.href.split("pull")[0];
    const pullId = window.location.href.split("pull")[1].substring(1);
    const elements = document.querySelectorAll(
      "span.commit-ref > a.no-underline > span.css-truncate-target"
    );
    const branchId = elements[1].innerHTML;
    const issueId = branchId.split("-")[1];
    const apiRepoUrl =
      "https://api.github.com/repos" +
      window.location.pathname.split("pull")[0];
    fetch(`${apiRepoUrl}issues/${issueId}`)
      .then((d) => d.json())
      .then((d) => {
        if (d && d.state && ["open", "closed"].includes(d.state)) {
          const mergeabilityContainer = document.querySelectorAll(
            "div.mergeability-details"
          )[0];
          const issueLink = document.createElement("span");
          const branchLink = document.createElement("span");
          issueLink.innerHTML = `<button class="btn-link">Issue #${issueId}</button>`;
          issueLink.addEventListener("click", () => {
            window.open(`${repoUrl}issues/${issueId}`, "_blank");
          });
          branchLink.innerHTML = `<button class="btn-link">${branchId}</button>`;
          branchLink.addEventListener("click", () => {
            window.open(`${repoUrl}tree/${branchId}`, "_blank");
          });
          const containerDiv = document.createElement("div");
          containerDiv.innerHTML = `<div class="merge-message" id="merge-message" style="background-color: #ff000011">
            <div class="js-merge-box"></div>
            <p class="alt-merge-options text-small mt-md-0 mt-2">
            View linked issue <span id="issue-container"></span>&nbsp;
            or view the source branch <span id="branch-container"></span>.
            </p>
        </div>
    `;
          containerDiv
            .querySelector("span#issue-container")
            .appendChild(issueLink);
          containerDiv
            .querySelector("span#branch-container")
            .appendChild(branchLink);
          mergeabilityContainer.appendChild(containerDiv);

          // FEATURE: Close linked issue
          let buttonDisabledCloseIssue = null;
          let buttonCloseIssue = null;
          if (d.state === "closed") {
            buttonDisabledCloseIssue = document.createElement("div");

            buttonDisabledCloseIssue.innerHTML = `
    <div class="BtnGroup">
      <button
        type="button"
        class="rounded-left-1 btn btn-danger disabled"
      >
      Linked issue closed
      </button>
    </div>`;

            containerDiv
              .getElementsByClassName("js-merge-box")[0]
              .appendChild(buttonDisabledCloseIssue);
            return;
          }
          if (d.state === "open") {
            buttonCloseIssue = document.createElement("div");

            buttonCloseIssue.innerHTML = `
      <div class="BtnGroup">
        <button
          type="button"
          class="rounded-left-1 btn btn-danger"
        >
        Close linked issue #${issueId}
        </button>
      </div>`;
          }
          buttonCloseIssue.addEventListener("click", (d) => {
            buttonCloseIssue.querySelector(
              "button"
            ).innerHTML = `Closing linked issue <span class="spinner" style="background-size: 18px 18px; width: 18px; height: 18px;"></span>`;
            fetch(`${repoUrl}issues/${issueId}`)
              .then((d) => d.text())
              .then((d) => {
                buttonCloseIssue.querySelector("button").innerHTML =
                  "Linked issue closed";
                buttonCloseIssue
                  .querySelector("button")
                  .classList.add("disabled");
                var ifrm = document.createElement("iframe");
                ifrm.style.width = "0px";
                ifrm.style.height = "0px";
                ifrm.style.display = "none";
                document.body.appendChild(ifrm);
                ifrm.srcdoc = d;
                ifrm.addEventListener("load", function () {
                  const doc = this.contentWindow.document;
                  const $form = doc.querySelector("form.js-new-comment-form");
                  const $comment = $form.querySelector("#new_comment_field");
                  $comment.value = `Closed from pull request ${window.location.href}`;
                  const $button = $form.querySelector(
                    "[name='comment_and_close']"
                  );
                  $button.click();
                });
              });
          });
          containerDiv
            .getElementsByClassName("js-merge-box")[0]
            .appendChild(buttonCloseIssue);
        }
      });
  }
  return;
})();
// Test comment