var episodePath = "";

events.userReady.push(function() {
    if (getURLParameter("prog") == null) {
        window.location.replace("index.html");
    } else {
        if (getURLParameter("episode") != null) {
            episodePath = "orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/episodes/" + getURLParameter("episode");
        } else if (getURLParameter("template") != null) {
            episodePath = "orgs/" + currentUser.orgName + "/programmes/" + getURLParameter("prog") + "/templates/" + getURLParameter("template");
        }
    }

    firebase.database().ref(episodePath).on("value", function(snapshot) {
        if (snapshot.val() == null) {
            window.location.replace("prog.html?prog=" + getURLParameter("prog"));
        } else {
            $(".progEpisodeName").text(snapshot.val().slug || "Untitled");

            if (getURLParameter("episode") != null) {
                $(".progEpisodeLink").attr("href", "progEpisode.html?prog=" + encodeURIComponent(getURLParameter("prog")) + "&episode=" + encodeURIComponent(getURLParameter("episode")));
            } else if (getURLParameter("template") != null) {
                $(".progEpisodeLink").attr("href", "progEpisode.html?prog=" + encodeURIComponent(getURLParameter("prog")) + "&template=" + encodeURIComponent(getURLParameter("template")));
            }

            $(".progEpisodeDescription").text(snapshot.val().description || "No description provided.");
        }

        $(".pageLoader").hide();
        $(".loadingSection").show();
    });
});

function editEpisodeDescription() {
    dialog("Edit programme description", `
        <div class="dialogLoader">
            <img src="https://imcnetwork.cf/LiveCloud/media/Loader.png" alt="Loading..." class="loader" />
        </div>
    `, [], false);

    firebase.database().ref(episodePath + "/description").once("value", function(snapshot) {
        dialog("Edit episode description", `
            <div>
                Edit the description of your episode so that others can gain a
                better understanding of what your epsiode is.
            </div>
            <div class="spacedTop">
                <label>
                    <textarea placeholder="Leave this field blank to remove the description entirely."></textarea>
                </label>
            </div>
            <p class="dialogError"></p>
        `, [
            {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
            {text: "Save", onclick: "editEpisodeDescriptionAction();", type: "primary"}
        ]);

        $(".dialogContent textarea").val(snapshot.val());
    });
}

function editEpisodeDescriptionAction() {
    $(".dialog button:last").attr("disabled", "true");

    firebase.database().ref(episodePath + "/description").set(
        $(".dialogContent textarea").val().trim() == "" ? null : $(".dialogContent textarea").val().trim()
    ).then(function() {
        $(".dialog button:last").attr("disabled", null);

        closeDialog();
    }).catch(function() {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("Your new episode description could not be saved. Please try again later.");
    });
}