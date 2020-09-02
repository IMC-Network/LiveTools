const RATIO_16BY9 = 9 / 16;

var currentPreviewPlayer;
var currentPreviewPlayerElement = null;

var selectedItem = null;

function showAddOptions() {
    if (currentPreviewPlayerElement != null) {
        videojs(currentPreviewPlayerElement).dispose();
    }

    selectedItem = null;

    $(".previewTitle").text("Add item");

    $(".previewContent").html("").append([
        $("<label>").append(
            $("<input id='addItemFromSourceUrl' placeholder='Enter a source URL here'>")
        ),
        $("<div class='right'>").append(
            $("<button id='addItemFromSourceButton'>")
                .text("Add item from source")
                .click(function() {
                    if (/^(http|https):\/\/.*\/(.*)$/.test($("#addItemFromSourceUrl").val().trim())) {
                        $(this).prop("disabled", true);

                        var newItemRef = firebase.database().ref(episodePath + "/content/library").push();
                        
                        newItemRef.set({
                            url: $("#addItemFromSourceUrl").val().trim(),
                            slug: ($("#addItemFromSourceUrl").val().trim().match(/^(http|https):\/\/.*\/(.*)$/)[2].split(".")[0] || "Untitled").trim()
                        }).then(function() {
                            showItemPreview(newItemRef.key);
                        });
                    } else {
                        $("#addItemFromSourceError").text("It seems that the URL you entered is invalid. Please enter a valid URL.");
                    }
                })
        ),
        $("<p id='addItemFromSourceError'>")
    ]);

    $(".libraryItem").removeClass("selected");
}

function showItemPreview(itemKey) {
    if (currentPreviewPlayerElement != null) {
        videojs(currentPreviewPlayerElement).dispose();
    }

    selectedItem = itemKey;

    $(".previewTitle").html("").append([
        $("<a>")
            .html("<i aria-hidden='true' class='material-icons'>arrow_left</i> Back")
            .attr("href", "javascript:showAddOptions();")
        ,
        $(document.createTextNode("Item preview"))
    ]);

    $(".previewContent").text("Loading...");

    $(".libraryItem").removeClass("selected");
    $(".libraryItem[data-key='" + itemKey + "']").addClass("selected");

    firebase.database().ref(episodePath + "/content/library/" + itemKey).once("value", function(snapshot) {
        var itemAttributes = [
            {key: "slug", label: "Slug", mandatory: true},
            {key: "url", label: "Source URL", mandatory: true},
            {key: "id", label: "Identifier", placeholder: "(Unassigned)"},
            {key: "notes", label: "Notes", type: "textarea"}
        ];

        $(".previewContent").html("").append($("<div class='previewArea spacedBottom'>"));

        for (var i = 0; i < itemAttributes.length; i++) {
            (function(itemAttribute) {
                $(".previewContent").append(
                    $("<label>").append([
                        $("<span>").text(itemAttribute.label),
                        $(itemAttribute.type == "textarea" ? "<textarea>" : "<input>")
                            .attr("placeholder", itemAttribute.placeholder)
                            .val(snapshot.val()[itemAttribute.key])
                            .change(function(event) {
                                if (!itemAttribute.mandatory || $(event.target).val().trim() != "") {
                                    firebase.database().ref(episodePath + "/content/library/" + itemKey + "/" + itemAttribute.key).set(
                                        $(event.target).val()
                                    );

                                    if (itemAttribute.key == "slug") {
                                        $(".libraryItem[data-key='" + itemKey + "'] .libraryItemSlug").text($(event.target).val());
                                    }

                                    $(".libraryItem[data-key='" + itemKey + "']").addClass("selected");
                                }
                            })
                    ])
                );
            })(itemAttributes[i]);
        }

        $(".previewContent").append([
            $("<hr>"),
            $("<button>")
                .text("Open")
                .click(function() {
                    window.open(snapshot.val().url);
                })
            ,
            " ",
            $("<button>")
                .text("Delete")
                .click(function() {
                    dialog("Delete item", `
                        Do you really want to delete this item? The item's data
                        will be permanently lost, but the contents of the item
                        may still be available at the target URL.
                    `, [
                        {text: "No", onclick: "closeDialog();", type: "secondary"},
                        {text: "Yes", onclick: "deleteSelectedItem();", type: "primary"}
                    ]);
                })
        ]);

        if (snapshot.val().url.endsWith(".mp4")) {
            $(".previewArea").append(
                $("<video controls width='300' height='200' class='video-js' id='previewPlayer'>")
                    .on("error", function() {
                        $(".previewArea").html("").append(
                            $("<p class='center'>")
                                .text("The contents of this item don't seem to exist. Check the URL to see if it is correct.")
                        );
                    })
            );

            currentPreviewPlayerElement = $("#previewPlayer")[0];

            videojs("previewPlayer", {}, function() {
                currentPreviewPlayer = this;

                currentPreviewPlayer.src(snapshot.val().url);

                currentPreviewPlayer.width($(".previewArea").width());
                currentPreviewPlayer.height($(".previewArea").width() * RATIO_16BY9);
            });
        } else if (snapshot.val().url.endsWith(".png") || snapshot.val().url.endsWith(".jpg") || snapshot.val().url.endsWith(".jpeg") || snapshot.val().url.endsWith(".gif")) {
            $(".previewArea").append(
                $("<img class='preview'>")
                    .attr("src", snapshot.val().url)
                    .attr("alt", "Image preview")
                    .on("error", function() {
                        $(".previewArea").html("").append(
                            $("<p class='center'>")
                                .text("The contents of this item don't seem to exist. Check the URL to see if it is correct.")
                        );
                    })
            );
        }
    });
}

function deleteSelectedItem() {
    firebase.database().ref(episodePath + "/content/library/" + selectedItem).remove();

    closeDialog();
    showAddOptions();
}

events.userReady.push(function() {
    firebase.database().ref(episodePath + "/content/library").on("value", function(snapshot) {
        $(".library").html("");

        snapshot.forEach(function(childSnapshot) {
            var thumbnail;

            if (childSnapshot.val().url.endsWith(".mp4")) {
                thumbnail = $("<video class='libraryItemThumbnail'>")
                    .attr("aria-label", "Video")
                    .append(
                        $("<source>").attr("src", childSnapshot.val().url + "#t=5")
                    )
                ;
            } else if (childSnapshot.val().url.endsWith(".png") || childSnapshot.val().url.endsWith(".jpg") || childSnapshot.val().url.endsWith(".jpeg") || childSnapshot.val().url.endsWith(".gif")) {
                thumbnail = $("<img class='libraryItemThumbnail'>")
                    .attr("alt", "Photo")
                    .attr("src", childSnapshot.val().url)
                    .on("error", function() {
                        this.onerror = null;
                        this.src = "https://imcnetwork.cf/LiveCloud/media/Blank App.png";
                    })
                ;
            } else {
                thumbnail = $("<img class='libraryItemThumbnail'>")
                    .attr("alt", "Unknown item")
                    .attr("src", "https://imcnetwork.cf/LiveCloud/media/Blank%20App.png")
                ;
            }

            $(".library").append(
                $("<button class='libraryItem'>")
                .attr("data-key", childSnapshot.key)
                    .append([
                        thumbnail,
                        $("<span class='libraryItemSlug'>").text(childSnapshot.val().slug)
                    ])
                    .click(function(event) {
                        showItemPreview(childSnapshot.key);
                        $(".rightPane a:first-of-type").focus();

                        event.stopPropagation();
                    })
            );
        });
    });

    showAddOptions();
});

$(window).resize(function() {
    if (currentPreviewPlayer) {
        currentPreviewPlayer.width($(".previewArea").width());
        currentPreviewPlayer.height($(".previewArea").width() * RATIO_16BY9);
    }
});