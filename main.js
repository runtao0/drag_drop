$(() => {
    const container = $('body');
    const userIDs = [ 1, 2 ];
    const model = 'users';
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
        console.log(table1);
        debugger
    })


    userIDs.forEach((id) => {
        jsonCall({ model, id })
        .then(handleUser(container))
        .then((albumList) => {
            return jsonCall({ model, id, associated })
            .then(handleAlbums(albumList))
        })
        .then((albumList) => {
            albumList.mousedown((e) => {
                const startX = e.clientX;
                const startY = e.clientY;

                const li = $(e.target).closest("li")[0];
                debugger
            })
        })
    })
})


const jsonCall = ({ model, id, associated, method }) => {
    return $.ajax({
        url: `https://jsonplaceholder.typicode.com/${model}/${id}/${associated ? associated : ''}`,
        method: method ? method : 'GET'
    })
}

const handleUser = (container) => (user) => {
    const name = user.name ? user.name : "No name";
    const section = $("<section>", { "class": "user-section", id: user.id });
    container.append(section);
    const albumList = $("<ul>", { "class": "album-list"});
    section.append(_userHeader(name))
        .append(albumList);

    return albumList;
}

const handleAlbums = (albumList) => (albums) => {
    albums.forEach(_addAlbumToList(albumList));
    return albumList;
}

const _addAlbumToList = (albumList) => (album) => {
    albumList.append(_albumListItem(album))
}

const _albumListItem = (album) => {
    return $("<li>", { id: album.id, draggable: true }).append(_albumID(album.id))
        .append(_albumTitle(album.title));
}

const _onDragStart = (first, second, third) => {
    debugger
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

class Table {
    constructor({ container }) {
        this.container = container;
        this.state = {};
        this.recordUser = this.recordUser.bind(this);
        // this.recordAlbums = this.recordAlbums.bind(this);
    }

    fetchModel({ model, id, associated, method }) {
        return $.ajax({
            url: `https://jsonplaceholder.typicode.com/${model}/${id}/${associated ? associated : ''}`,
            method: method ? method : 'GET'
        })
    }
    //refactor this to look like recordAlbums
    recordUser(user) {
        const newState = {};
        newState[user.id] = user
        this.state = Object.assign({}, this.state, newState);
        return this;
    }

    // recordUser({ model, id, associated, method }) {
    //     return new Promise
    // }

    _storeAlbums(albums) {
        albums.forEach((album) => {
            if (!this.state[album.userId]) {
                console.log("Wrong user");
                return;
            } else {
                if (!this.state[album.userId].albums) {
                    this.state[album.userId].albums = {};
                    this.state[album.userId].albums[album.id] = album;
                } else {
                    this.state[album.userId].albums[album.id] = album;
                }
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

    // renderUsers() {
    //     const userIDs = Object.keys(this.state)
    //     const name = user.name ? user.name : "No name";
    //     const section = $("<section>", { "class": "user-section", id: user.id });
    // }
    // const handleUser = (container) => (user) => {
    //
    //     container.append(section);
    //     const albumList = $("<ul>", { "class": "album-list"});
    //     section.append(_userHeader(name))
    //         .append(albumList);
    //
    //     return albumList;
    // }
}
// const newSection = ({id})
