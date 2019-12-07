function userReady() {
    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog")).on("value", function(snapshot) {
        if (snapshot.val() == null) {
            window.location.href = "index.html";
        } else {
            $(".progName").text(snapshot.val().name || "Untitled");
            $(".progLink").attr("href", "prog.html?prog=" + encodeURIComponent(getURLParameter("prog")));
            $(".progDescription").text(snapshot.val().description || "No description provided.");

            firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes").on("value", function(snapshot) {
                $(".progEpisodes").html("");

                if (snapshot.val() == null) {
                    $(".progEpisodes").html(`
                        <p>
                            It appears that you don't have any episodes for
                            this programme yet. Add episodes by pressing the
                            <strong>New Episode</strong> button.
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
                    `).appendTo(".progEpisodes");

                    console.log(snapshot.val());

                    for (var key in snapshot.val()) {
                        $(`
                            <tr>
                                <td data-col="slug" class="tableColumnNoWrap"></td>
                                <td data-col="firstTXDate" class="tableColumnNoWrap"></td>
                                <td data-col="options" class="tableColumnNoWrap">
                                    <button>Open</button>
                                    <button>Delete</button>
                                </td>
                            </tr>
                        `).appendTo(".progEpisodes table > tbody");

                        $(".progEpisodes table > tbody [data-col='slug']:last").text(snapshot.val()[key].slug || "Untitled");
                        $(".progEpisodes table > tbody [data-col='firstTXDate']:last").text(new Date(snapshot.val()[key].firstTXDate).toLocaleDateString({
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric"
                        }) || "Unknown");
                    }
                }
            });

            $(".pageLoader").hide();
            $(".loadingSection").show();
        }
    });
}

function newEpisode() {
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
        </div>
        <p class="dialogError"></p>
    `, [
        {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
        {text: "Create", onclick: "newEpisodeAction();", type: "primary"}
    ]);
}

function newEpisodeAction() {
    $(".dialog button:last").attr("disabled", "true");

    if ($(".newEpisodeFirstTXDate").val().trim() == "" || $(".newEpisodeFirstTXDate").val().trim() == "" || new Date($(".newEpisodeFirstTXDate").val().trim()).getTime() == NaN) {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("It appears that you have left some fields blank. Please enter data into those fields and try again.");
    } else {
        firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes").push().set({
            slug: $(".newEpisodeSlug").val().trim(),
            firstTXDate: new Date($(".newEpisodeFirstTXDate").val().trim()).getTime()
        }).then(function() {
            $(".dialog button:last").attr("disabled", null);

            closeDialog();
        }).catch(function() {
            $(".dialog button:last").attr("disabled", null);

            $(".dialogError").text("Your new programme description could not be saved. Please try again later.");
        });
    }
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