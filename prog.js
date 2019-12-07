function userReady() {
    firebase.database().ref("orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog")).on("value", function(snapshot) {
        if (snapshot.val() == null) {
            window.location.href = "index.html";
        } else {
            $(".progName").text(snapshot.val().name || "Untitled");
            $(".progLink").attr("href", "prog.html?prog=" + encodeURIComponent(getURLParameter("prog")));
            $(".progDescription").text(snapshot.val().description || "No description provided.");

            $(".pageLoader").hide();
            $(".loadingSection").show();
        }
    });
}

function editProgrammeDescription() {
    dialog("Edit programme description", `
        <div class="center">
            <img src="https://imcnetwork.cf/LiveCloud/media/Loader.png" alt="Loading..." class="loader dialogLoader" />
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
            <p class="newProgrammeError"></p>
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

        $(".newProgrammeError").text("Your new programme description could not be saved. Please try again later.");
    });
}