function newProgramme() {
    dialog("New programme", `
        <div>
            Create a new programme that can contain episodes. You can modify
            other aspects such as the thumbnail text appearance later.
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
        <p class="newProgrammeError"></p>
    `, [
        {text: "Cancel", onclick: "closeDialog();", type: "secondary"},
        {text: "Create", onclick: "newProgrammeAction();", type: "primary"}
    ]);
}

function newProgrammeAction() {
    $(".dialog button:last").attr("disabled", "true");

    if ($(".newProgrammeName").val().trim() == "") {
        $(".dialog button:last").attr("disabled", null);

        $(".newProgrammeError").text("It appears that you have left some fields blank. Please enter data into those fields and try again.");
    } else {
        firebase.database().ref("orgs/" + currentUser.orgName + "/programmes").push().set({
            name: $(".newProgrammeName").val().trim(),
            thumbnail: $(".newProgrammeThumbnail").val().trim() == "" ? null : $(".newProgrammeThumbnail").val()
        }).then(function() {
            closeDialog();
        }).catch(function() {
            $(".dialog button:last").attr("disabled", null);

            $(".newProgrammeError").text("Your programme could not be created. Please try again later.");            
        });
    }
}