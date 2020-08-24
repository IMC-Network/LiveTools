const RATIO_16BY9 = 9 / 16;

var currentPreviewPlayer;
var currentPreviewPlayerElement = null;

function showAddOptions() {
    if (currentPreviewPlayerElement != null) {
        videojs(currentPreviewPlayerElement).dispose();
    }

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
            {key: "url", label: "Source URL", mandatory: true}
        ];

        $(".previewContent").html("").append($("<div class='previewArea spacedBottom'>"));

        for (var i = 0; i < itemAttributes.length; i++) {
            (function(itemAttribute) {
                $(".previewContent").append(
                    $("<label>").append([
                        $("<span>").text(itemAttribute.label),
                        $("<input>")
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

        if (snapshot.val().url.endsWith(".mp4")) {
            $(".previewArea").append(
                $("<video controls width='300' height='200' class='video-js' id='previewPlayer'>")
            );

            currentPreviewPlayerElement = $("#previewPlayer")[0];

            videojs("previewPlayer", {}, function() {
                currentPreviewPlayer = this;

                currentPreviewPlayer.src(snapshot.val().url);

                currentPreviewPlayer.width($(".previewArea").width());
                currentPreviewPlayer.height($(".previewArea").width() * RATIO_16BY9);
            });
        }
    });
}

events.userReady.push(function() {
    firebase.database().ref(episodePath + "/content/library").on("value", function(snapshot) {
        $(".library").html("");

        snapshot.forEach(function(childSnapshot) {
            $(".library").append(
                $("<button class='libraryItem'>")
                .attr("data-key", childSnapshot.key)
                    .append([
                        $("<img class='libraryItemThumbnail'>").attr("src", "https://imcnetwork.cf/LiveCloud/media/Blank%20App.png"),
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