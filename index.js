function newProgramme() {
    dialog("New programme", `
        <div>
            Create a new programme that can contain episodes. You can modify
            this information and much more later.
        </div>
        <div class="spacedTop">
            <label>
                <span>Name</span>
                <input class="newProgrammeName">
            </label>
            <label>
                <span>Thumbnail</span>
                <input placeholder="Enter a URL to an image (optional)" class="newProgrammeThumbnail">
            </label>
        </div>
        <p class="dialogError"></p>
    `, [
        {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
        {text: "Create", onclick: "newProgrammeAction();", type: "primary"}
    ]);
}

function newProgrammeAction() {
    $(".dialog button:last").attr("disabled", "true");

    if ($(".newProgrammeName").val().trim() == "") {
        $(".dialog button:last").attr("disabled", null);

        $(".dialogError").text("It appears that you have left some fields blank. Please enter data into those fields and try again.");
    } else {
        firebase.database().ref("orgs/" + currentUser.orgName + "/programmes").push().set({
            name: $(".newProgrammeName").val().trim(),
            thumbnail: $(".newProgrammeThumbnail").val().trim() == "" ? null : $(".newProgrammeThumbnail").val().trim()
        }).then(function() {
            $(".dialog button:last").attr("disabled", null);

            closeDialog();
        }).catch(function() {
            $(".dialog button:last").attr("disabled", null);

            $(".dialogError").text("Your programme could not be created. Please try again later.");
        });
    }
}

$(function() {
    if (getURLParameter("prog") != null) {
        window.location.replace("prog.html?prog=" + encodeURIComponent(getURLParameter("prog")));
    }
})