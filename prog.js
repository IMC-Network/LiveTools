var useEpisodeKey = "";
var useTemplateKey = "";

function userReady() {
    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog")).on("value", function(snapshot) {
        if (snapshot.val() == null) {
            window.location.href = "index.html";
        } else {
            $(".progName").text(snapshot.val().name || "Untitled");
            $(".progLink").attr("href", "prog.html?prog=" + encodeURIComponent(getURLParameter("prog")));
            $(".progTemplatesLink").attr("href", "progTemplates.html?prog=" + encodeURIComponent(getURLParameter("prog")));
            $(".progDescription").text(snapshot.val().description || "No description provided.");

            firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes").orderByChild("firstTXDate").on("value", function(snapshot) {
                $(".progEpisodes").html("");

                if (snapshot.val() == null) {
                    $(".progEpisodes").html(`
                        <p>
                            It appears that you don't have any episodes for
                            this programme yet. Add episodes by pressing the
                            <strong>New episode</strong> button.
                        </p>
                    `);
                } else {
                    $(`
                        <div class="tableHolder">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Slug</th>
                                        <th>First TX date</th>
                                        <th>Template used</th>
                                        <th width="120">Options</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    `).appendTo(".progEpisodes");

                    snapshot.forEach(function(childSnapshot) {
                        $(".progEpisodes table > tbody").prepend($(`
                            <tr>
                                <td data-col="slug" class="tableColumnNoWrap"></td>
                                <td data-col="firstTXDate" class="tableColumnNoWrap"></td>
                                <td data-col="templateUsed" class="tableColumnNoWrap"></td>
                                <td data-col="options" class="tableColumnNoWrap">
                                    <button data-option="open">Open</button>
                                    <button data-option="delete">Delete</button>
                                </td>
                            </tr>
                        `));

                        $(".progEpisodes table > tbody [data-col='slug']:first").text(childSnapshot.val().slug || "Untitled");
                        $(".progEpisodes table > tbody [data-col='firstTXDate']:first").text(new Date(childSnapshot.val().firstTXDate).toLocaleDateString(lang.lang, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        }) || "Unknown");

                        if (childSnapshot.val().templateKey != null) {
                            $(".progEpisodes table > tbody [data-col='templateUsed']:first").append($("<a>")
                                .attr("href", "progEpisode.html?prog=" + encodeURIComponent(getURLParameter("prog")) + "&template=" + encodeURIComponent(childSnapshot.val().templateKey))
                                .text(childSnapshot.val().templateSlug || "Untitled")
                            );
                        } else {
                            $(".progEpisodes table > tbody [data-col='templateUsed']:first").text("(None)");
                        }

                        (function(key) {
                            $(".progEpisodes table > tbody [data-col='options']:first [data-option='open']").click(function() {
                                window.location.href = "progEpisode.html?prog=" + encodeURIComponent(getURLParameter("prog")) + "&episode=" + encodeURIComponent(key);
                            });

                            $(".progEpisodes table > tbody [data-col='options']:first [data-option='delete']").click(function() {
                                deleteEpisode(key);
                            });
                        })(childSnapshot.key);
                    });
                }
            });

            firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates").orderByChild("firstTXDate").on("value", function(snapshot) {
                $(".progTemplates").html("");

                if (snapshot.val() == null) {
                    $(".progTemplates").html(`
                        <p>
                            It appears that you don't have any templates for
                            this programme yet. Add templates by pressing the
                            <strong>New template</strong> button.
                        </p>
                        <p>
                            Episodes can be made out of templates so that you
                            can easily inherit the flow and structure of the
                            programme. Templates define the skeleton of
                            episodes, and can be reused again and again.
                        </p>
                    `);
                } else {
                    $(`
                        <div class="tableHolder">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Slug</th>
                                        <th>First TX date</th>
                                        <th width="120">Options</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </table>
                        </div>
                    `).appendTo(".progTemplates");

                    snapshot.forEach(function(childSnapshot) {
                        $(".progTemplates table > tbody").prepend($(`
                            <tr>
                                <td data-col="slug" class="tableColumnNoWrap"></td>
                                <td data-col="firstTXDate" class="tableColumnNoWrap"></td>
                                <td data-col="options" class="tableColumnNoWrap">
                                    <button data-option="open">Open</button>
                                    <button data-option="delete">Delete</button>
                                </td>
                            </tr>
                        `));

                        $(".progTemplates table > tbody [data-col='slug']:first").text(childSnapshot.val().slug || "Untitled");
                        $(".progTemplates table > tbody [data-col='firstTXDate']:first").text(new Date(childSnapshot.val().firstTXDate).toLocaleDateString(lang.lang, {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        }) || "Unknown");

                        (function(key) {
                            $(".progTemplates table > tbody [data-col='options']:first [data-option='open']").click(function() {
                                window.location.href = "progEpisode.html?prog=" + encodeURIComponent(getURLParameter("prog")) + "&template=" + encodeURIComponent(key);
                            });

                            $(".progTemplates table > tbody [data-col='options']:first [data-option='delete']").click(function() {
                                deleteTemplate(key);
                            });
                        })(childSnapshot.key);
                    });
                }
            });

            $(".pageLoader").hide();
            $(".loadingSection").show();
        }
    });
}

function editProgrammeDescription() {
    dialog("Edit programme description", `
        <div class="dialogLoader">
            <img src="https://imcnetwork.cf/LiveCloud/media/Loader.png" alt="Loading..." class="loader" />
        </div>
    `, [], false);

    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/description").once("value", function(snapshot) {
        dialog("Edit programme description", `
            <div>
                Edit the description of your programme so that others can
                gain a better understanding of what your programme is.
            </div>
            <div class="spacedTop">
                <label>
                    <textarea placeholder="Leave this field blank to remove the description entirely."></textarea>
                </label>
            </div>
            <p class="dialogError"></p>
        `, [
            {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
            {text: "Save", onclick: "editProgrammeDescriptionAction();", type: "primary"}
        ]);

        $(".dialogContent textarea").val(snapshot.val());
    });
}

function editProgrammeDescriptionAction() {
    $(".dialog button:last").attr("disabled", "true");

    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/description").set(
        $(".dialogContent textarea").val().trim() == "" ? null : $(".dialogContent textarea").val().trim()
    ).then(function() {
        $(".dialog button:last").attr("disabled", null);

        closeDialog();
    }).catch(function() {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("Your new programme description could not be saved. Please try again later.");
    });
}

function newEpisode() {
    dialog("New episode", `
        <div class="dialogLoader">
            <img src="https://imcnetwork.cf/LiveCloud/media/Loader.png" alt="Loading..." class="loader" />
        </div>
    `, [], false);

    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates").once("value", function(snapshot) {
        dialog("New episode", `
            <div>
                Create a new episode as part of the programme. Templates will be
                copied over so that you can easily create the episode.
            </div>
            <div class="spacedTop">
                <label>
                    <span>Slug</span>
                    <input placeholder="Enter the name of the episode" class="newEpisodeSlug">
                </label>
                <label>
                    <span>First TX date</span>
                    <input type="datetime-local" class="newEpisodeFirstTXDate">
                </label>
                <label>
                    <span>Template</span>
                    <select class="newEpisodeTemplate">
                        <option value="\\none">(None)</option>
                    </select>
                </label>
            </div>
            <p class="dialogError"></p>
        `, [
            {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
            {text: "Create", onclick: "newEpisodeAction();", type: "primary"}
        ]);

        snapshot.forEach(function(childSnapshot) {
            $(".newEpisodeTemplate").append($("<option>")
                .attr("value", childSnapshot.key)
                .text(childSnapshot.val().slug)
            );
        });
    });
}

function newEpisodeAction() {
    $(".dialog button:last").attr("disabled", "true");

    if ($(".newEpisodeFirstTXDate").val().trim() == "" || $(".newEpisodeFirstTXDate").val().trim() == "" || isNaN(new Date($(".newEpisodeFirstTXDate").val().trim()).getTime())) {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("It appears that you have left some fields blank or incorrectly formatted. Please enter data into those fields and try again.");
    } else {
        function newEpisodeWithContent(templateContent = {}, templateKey = null, templateSlug = null) {
            firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes").push().set({
                slug: $(".newEpisodeSlug").val().trim(),
                firstTXDate: new Date($(".newEpisodeFirstTXDate").val().trim()).getTime(),
                content: templateContent,
                templateKey: templateKey,
                templateSlug: templateSlug
            }).then(function() {
                $(".dialog button:last").attr("disabled", null);
    
                closeDialog();
            }).catch(function() {
                $(".dialog button:last").attr("disabled", null);
    
                $(".dialogError").text("Your new episode could not be created. Please try again later.");
            });
        }

        if ($(".newEpisodeTemplate").val() == "\\none") {
            newEpisodeWithContent({});
        } else {
            firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates/" + $(".newEpisodeTemplate").val()).once("value", function(snapshot) {
                if (snapshot.val().content == null) {
                    newEpisodeWithContent({}, snapshot.key, snapshot.val().slug);
                } else {
                    newEpisodeWithContent(snapshot.val().content, snapshot.key, snapshot.val().slug);
                }                
            }).catch(function() {
                $(".dialog button:last").attr("disabled", null);

                $(".dialogError").text("The template your new episode could not be retrieved. Please try again later.");
            });
        }
    }
}

function deleteEpisode(episodeKey) {
    useEpisodeKey = episodeKey;

    dialog("Delete episode", `
        <div>
            Do you really want to delete this episode? Once deleted, the
            episode cannot be recovered.
        </div>
        <p class="dialogError"></p>
    `, [
        {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
        {text: "Delete", onclick: "deleteEpisodeAction();", type: "primary"}
    ]);
}

function deleteEpisodeAction() {
    $(".dialog button:last").attr("disabled", "true");

    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes/" + useEpisodeKey).remove().then(function() {
        $(".dialog button:last").attr("disabled", null);

        closeDialog();
    }).catch(function() {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("Your episode could not be deleted. Please try again later.");
    });
}

function newTemplate() {
    dialog("New template", `
        <div>
            Create a new template to use in episodes. Templates can be copied
            to create new episodes and can be reused again and again.
        </div>
        <div class="spacedTop">
            <label>
                <span>Slug</span>
                <input placeholder="Enter the name of the template" class="newTemplateSlug">
            </label>
            <label>
                <span>First TX date</span>
                <input type="datetime-local" class="newTemplateFirstTXDate">
            </label>
        </div>
        <p class="dialogError"></p>
    `, [
        {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
        {text: "Create", onclick: "newTemplateAction();", type: "primary"}
    ]);
}

function newTemplateAction() {
    $(".dialog button:last").attr("disabled", "true");

    if ($(".newTemplateFirstTXDate").val().trim() == "" || $(".newTemplateFirstTXDate").val().trim() == "" || isNaN(new Date($(".newTemplateFirstTXDate").val().trim()).getTime())) {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("It appears that you have left some fields blank or incorrectly formatted. Please enter data into those fields and try again.");
    } else {
        firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates").push().set({
            slug: $(".newTemplateSlug").val().trim(),
            firstTXDate: new Date($(".newTemplateFirstTXDate").val().trim()).getTime()
        }).then(function() {
            $(".dialog button:last").attr("disabled", null);

            closeDialog();
        }).catch(function() {
            $(".dialog button:last").attr("disabled", null);

            $(".dialogError").text("Your new template could not be created. Please try again later.");
        });
    }
}

function deleteTemplate(templateKey) {
    useTemplateKey = templateKey;

    dialog("Delete template", `
        <div>
            Do you really want to delete this template? Once deleted, the
            template cannot be recovered.
        </div>
        <div class="spacedTop">
            <strong>Note:</strong> Episodes that have been created by this
            template will not be deleted.
        </p>
        <p class="dialogError"></p>
    `, [
        {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
        {text: "Delete", onclick: "deleteTemplateAction();", type: "primary"}
    ]);
}

function deleteTemplateAction() {
    $(".dialog button:last").attr("disabled", "true");

    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates/" + useTemplateKey).remove().then(function() {
        $(".dialog button:last").attr("disabled", null);

        closeDialog();
    }).catch(function() {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("Your template could not be deleted. Please try again later.");
    });
}