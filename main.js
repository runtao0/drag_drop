$(() => {
    const container = $('body');
    const userIDs = [ 1, 2 ];
    const model = 'users';

    // make this mmore modular
    const associated = "albums";
    const table1 = new Table({ container });

    const deferred = [];
    userIDs.forEach((id) => {
        deferred.push(
            table1.fetchModel({ model: 'users', id })
            .then((user) => table1.recordUser(user))
            .then(Table.recordAlbums({ id }))
        )
    })

    $.when(...deferred).then((table) => {
        table.render();
        table.addDragEvents();
        console.log(table1);
    })

})

const _albumList = (userID) => {
    return $("<ul>", { "class": "album-list", id: `${userID}-user`});
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

class Table {
    constructor({ container }) {
        this.container = container;
        this.state = {};
        this.recordUser = this.recordUser.bind(this);
        // this.recordAlbums = this.recordAlbums.bind(this);
        this._renderUsers = this._renderUsers.bind(this);
        this._replaceAlbums = this._replaceAlbums.bind(this);
        this._moveListItem = this._moveListItem.bind(this);
    }

    fetchModel({ model, id, associated }) {
        return $.ajax({
            url: `https://jsonplaceholder.typicode.com/${model}/${id}/${associated ? associated : ''}`,
            method: 'GET'
        })
    }

    _patchModel({ userId, id }) {
        debugger
        return $.ajax({
            url: `https://jsonplaceholder.typicode.com/albums/${id}/`,
            method: 'PATCH',
            data: {
                userId
            }
        })
    }

    recordUser(user) {
        const newState = {};
        newState[user.id] = user
        this.state = Object.assign({}, this.state, newState);
        return this;
    }


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

    static recordAlbums({id}) {
        return (table) => {
            return table.fetchModel({ model: 'users', id, associated: 'albums'})
                .then(table._storeAlbums.bind(table))
        }

    }

    render() {
        this._renderUsers()
        this._replaceAlbums()
    }

    //not pure
    _renderUsers() {
        for (let userID in this.state) {
            const name = this.state[userID].name ? this.state[userID].name : "No name";
            const section = $("<section>", { "class": "user-section"});
            this.state[userID].list = _albumList(userID);
            section.append(_userHeader(name))
                .append(_legend())
                .append(this.state[userID].list);

            this.container.append(section);
        }
    }

    _replaceAlbums() {
        for (let userID in this.state) {
            for (let albumID in this.state[userID].albums) {
                const listItem = _albumListItem(this.state[userID].albums[albumID])
                this.state[userID].list.append(listItem);
                this.state[userID].albums[albumID].element = listItem;
            }
        }
    }

    addDragEvents() {
        for (let userID in this.state) {
            if (!this.state[userID].list) alert("cannot add drag");
            this.state[userID].list.mousedown((e) => {
                const section = $(e.target).closest("section")
                const li = $(e.target).closest("li");
                const parent = li.parent();
                if (!li) return;

                section.css('z-index', "1")
                li.css('z-index', '5');

                const initialLiPosition = li.offset();
                const initialMouseX = e.clientX;
                const initialMouseY = e.clientY;

                document.onmousemove = this._onMouseMove({ li, initialMouseX, initialMouseY, initialLiPosition })
                document.onmouseup = this._onMouseUp({ li, section, initialLiPosition, parent })
            })
        }
    }

    _onMouseMove({ li, initialMouseX, initialMouseY, initialLiPosition }) {
        return (e2) => {
            const currentMouseX = e2.clientX;
            const currentMouseY = e2.clientY;

            li.offset({
                left: ((currentMouseX - initialMouseX) + initialLiPosition.left),
                top: ((currentMouseY - initialMouseY) + initialLiPosition.top)
            })
        }
    }

    _onMouseUp({ li, section, initialLiPosition, parent }) {
        return (e3) => {
            let returnToOrigin = true;
            const mouseUpX = e3.clientX;
            const mouseUpY = e3.clientY;
            $(".album-list").each((index, albumList) => {
                const $albumList = $(albumList);
                const albumPosition = $albumList.offset();
                if ((mouseUpX > albumPosition.left && mouseUpX < (albumPosition.left + $albumList.width())) &&
                    (mouseUpY > albumPosition.top && mouseUpY < albumPosition.top + $albumList.height())) {
                        if (albumList !== parent[0]) {
                            returnToOrigin = false;
                            $.when(this._patchModel({
                                userId: parseInt(albumList.id, 10),
                                id: li[0].id
                            })).then((x) => {
                                    debugger
                                })
                            //landed in the other list
                        }
                } else {
                    return;
                }
            })
            if (returnToOrigin) li.offset(initialLiPosition);
            document.onmousemove = null
            section.css('z-index', "0")
        }
    }

    _moveListItem(item) {
        // removefromoldcolumn
        // addtoNewColumn
    }



    _removeFromOldColumn({ parent, target, }){
        // remove from state
        //and remove from ul

    }
}
