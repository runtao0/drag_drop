$(() => {
    // this runs after document is ready
    // 1. sets up container and a table instance
    // 2. for each user, an asynce chain is made that will get user info and
    //    associated albums
    // 3. when all user and album information is received, corresponding DOM
    //    elements are generated and drag events are set up. An alert occurs
    //    on error
    // #1
    const container = $('body');
    const userIds = [ 1, 2 ];
    const table1 = new Table({ container });
    // #2
    const deferred = [];
    userIds.forEach((id) => {
        deferred.push(
            table1.fetchModel({ id })
            .then((user) => table1.recordUser(user))
            .then(Table.recordAlbums({ id }))
        )
    })
    // #3
    $.when(...deferred).then((table) => {
        table.render();
        table.addDragEvents();
    }).fail(() => {
        alert("Something went wrong fetching the data, please try again")
    })
})

// these are helper methods that generate and manipulate DOM elements
const _albumList = (userId) => {
    return $("<ul>", { "class": "album-list", id: `${userId}-user`});
}

const _albumListItem = (album) => {
    return $("<li>", { id: album.id }).append(_albumID(album.id))
        .append(_albumTitle(album.title));
}

const _albumID = (id) => {
    return $("<div>").text(`${id}`);
}

const _albumTitle = (title) => {
    return $("<div>").text(`${title}`);
}

const _userHeader = (name) => {
    return $("<h2>", { "class": "name"}).text(`${name}`);
}

const _legend = () => {
    return $("<article>").append($("<div>").text("id"))
        .append($("<div>").text("title"));
}

const _triggerLoader = () => {
    const loader = $("#loader");
    loader.css("display", "block");
}

const _hideLoader = () => {
    const loader = $("#loader");
    loader.css("display", "none");
}

const _withinBounds = ({ mouseUpX, mouseUpY, $element }) => {
    const elePosition = $element.offset();
    return ((mouseUpX > elePosition.left && mouseUpX < (elePosition.left + $element.width())) &&
        (mouseUpY > elePosition.top && mouseUpY < elePosition.top + $element.height()))
}

// Table object that contains the information for users and their albums, and
// the DOM elements associated with them.
class Table {
    constructor({ container }) {
        this.container = container;
        this.state = {};

        this.recordUser = this.recordUser.bind(this);
        this._renderUsers = this._renderUsers.bind(this);
        this._replaceAlbums = this._replaceAlbums.bind(this);
        this._addAlbumToState = this._addAlbumToState.bind(this);
        this._removeFromOldColumn = this._removeFromOldColumn.bind(this);
    }

    // Get request for a model and/or an associated model
    fetchModel({ model = "users", id, associated = "" }) {
        return $.ajax({
            url: `https://jsonplaceholder.typicode.com/${model}/${id}/${associated}`,
            method: 'GET'
        })
    }

    //Patch request to change the userID of an album
    _patchModel({ model = "albums", userId, id }) {
        return $.ajax({
            url: `https://jsonplaceholder.typicode.com/${model}/${id}/`,
            method: 'PATCH',
            data: {
                userId
            }
        })
    }

    // Records user in table state
    // I chose OOP over functional...because it was faster
    recordUser(user) {
        // const newState = {};
        this.state[user.id] = user
        // this.state = Object.assign({}, this.state, newState);
        return this;
    }

    // Creates user and album DOM elements
    render() {
        this._renderUsers()
        this._replaceAlbums()
    }

    // Records album to table state
    _storeAlbums(albums) {
        albums.forEach((album) => {
            if (!this.state[album.userId]) {
                console.log("Wrong user");
                return;
            } else {
                if (!this.state[album.userId].albums) {
                    this.state[album.userId].albums = {};
                }
                    this.state[album.userId].albums[album.id] = album;
            }
        });
        return this;
    }

    // Meant to follow fetchModel in promise chain, fetches albums and stores them
    static recordAlbums({id}) {
        return (table) => {
            return table.fetchModel({ model: 'users', id, associated: 'albums'})
                .then(table._storeAlbums.bind(table))
        }
    }

    // Creates DOM elements for users
    _renderUsers() {
        for (let userId in this.state) {
            const name = this.state[userId].name ? this.state[userId].name : "No name";
            const section = $("<section>", { "class": "user-section" });
            this.state[userId].list = _albumList(userId);
            section.append(_userHeader(name))
                .append(_legend())
                .append(this.state[userId].list);

            this.container.append(section);
        }
    }

    // Creats DOm elements for albums
    _replaceAlbums() {
        for (let userId in this.state) {
            for (let albumID in this.state[userId].albums) {
                const listItem = _albumListItem(this.state[userId].albums[albumID])
                this.state[userId].list.append(listItem);
                this.state[userId].albums[albumID] = listItem;
            }
        }
    }

    // Creates drag event on all the ul.album-list 's
    // 1. selects relevant DOM elements
    // 2. brings section to front so selected li is always on top
    // 3. sets up mousemove and mouseup to complete drag and drop functionality
    addDragEvents() {
        for (let userId in this.state) {
            if (!this.state[userId].list) alert("cannot add drag");
            this.state[userId].list.mousedown((e) => {
                // #1
                const section = $(e.target).closest("section")
                const li = $(e.target).closest("li");
                if (!li) return;
                const parent = li.parent();
                // #2
                section.css('z-index', "1");
                li.css('z-index', '500');
                // #3
                const initialLiPosition = li.offset();
                const initialMouseX = e.clientX;
                const initialMouseY = e.clientY;
                document.onmousemove = this._onMouseMove({ li, initialMouseX, initialMouseY, initialLiPosition, parent })
                document.onmouseup = this._onMouseUp({ li, section, initialLiPosition, parent })
            })
        }
    }

    // Mouse move event
    // 1. updates parent element and grabs mouse position
    // 2. moves the element position based on mouse movement
    _onMouseMove({ li, initialMouseX, initialMouseY, initialLiPosition, parent }) {
        return (e2) => {
            // #1
            parent.css("overflow", "visible");
            const currentMouseX = e2.clientX;
            const currentMouseY = e2.clientY;
            // #2
            li.offset({
                left: ((currentMouseX - initialMouseX) + initialLiPosition.left),
                top: ((currentMouseY - initialMouseY) + initialLiPosition.top)
            })
        }
    }

    // Mouse up event for drag and drop
    // 1. grabs mouse position and sets up return boolean
    // 2. loops through the ul.album-list and checks if the mouse is over one,
    //    only proceeds if the target ul is not the origin ul
    // 3. adds new album to the table instance and updates the DOM accordingly,
    //    alerts if there was failure, and returns DOM to original position
    // 4. return elements to original order,
    //    return li if mouse did not reach target,
    //    remove mousemove event function,
    _onMouseUp({ li, section, initialLiPosition, parent }) {
        return (e3) => {
            // #1
            let returnToOrigin = true;
            const mouseUpX = e3.clientX;
            const mouseUpY = e3.clientY;
            // #2
            $(".album-list").each((index, albumList) => {
                const $albumList = $(albumList);
                if (_withinBounds({ mouseUpX, mouseUpY, $element: $albumList })) {
                    if (albumList !== parent[0]) {
                        _triggerLoader();
                        returnToOrigin = false;
                        $.when(this._patchModel({
                            userId: parseInt(albumList.id, 10),
                            id: li[0].id
                        })).then((album) => {
                            // #3
                            this._addAlbumToState(album);
                            this._removeFromOldColumn({
                                parent,
                                li
                            });
                            _hideLoader()
                        }).fail((err) => {
                            _hideLoader();
                            li.offset(initialLiPosition);
                            alert("There was an error: ");
                        })
                    }
                }
                $albumList.css("overflow-y", "scroll");
            })
            // #4
            li.css('z-index', '0');
            section.css('z-index', "0");
            if (returnToOrigin) li.offset(initialLiPosition);
            document.onmousemove = null;
        }
    }

    // Takes an album object and adds them to the state and updates the DOM
    // according to the new userId
    _addAlbumToState(album) {
        const li = _albumListItem(album);
        this.state[album.userId].albums[album.id] = li;
        this.state[album.userId].list.append($(li))
    }

    // Removes li from DOM and from the table state
    _removeFromOldColumn({ parent, li }){
        li.remove()
        const userId = parseInt(parent[0].id);
        this.state[userId].albums[li.id] = undefined;
    }
}
