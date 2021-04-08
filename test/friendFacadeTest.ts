import * as mongo from "mongodb"
import FriendFacade from '../src/facades/friendFacade';

import chai from "chai";
const expect = chai.expect;

//use these two lines for more streamlined tests of promise operations
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import bcryptjs from "bcryptjs"
import { InMemoryDbConnector } from "../src/config/dbConnector"
import { ApiError } from "../src/errors/errors";

let friendCollection: mongo.Collection;
let facade: FriendFacade;

describe("## Verify the Friends Facade ##", () => {

    before(async function () {
        const client = await InMemoryDbConnector.connect()
        const db = client.db()
        friendCollection = db.collection("friends")
        facade = new FriendFacade(db)
    })

    beforeEach(async () => {
        const hashedPW = await bcryptjs.hash("secret", 4)
        await friendCollection.deleteMany({})
        await friendCollection.insertMany([
            { firstName: "Anders", lastName: "And", email: "AndAnders@anden.and", password: hashedPW, role: "user" },
            { firstName: "Donald", lastName: "Duck", email: "dd@b.dk", password: hashedPW, role: "user" },
            { firstName: "Jens", lastName: "Jenssen", email: "jj@j.dk", password: hashedPW, role: "user" },
            { firstName: "Hans", lastName: "Hansen", email: "hh@hh.dk", password: hashedPW, role: "user" },
        ])
        //Create a few few testusers for ALL the tests
    })

    describe("Verify the addFriend method", () => {
        it("It should Add the user Jan", async () => {
            const newFriend = { firstName: "Jan", lastName: "Olsen", email: "jan@b.dk", password: "secret" }
            const status = await facade.addFriend(newFriend);
            expect(status).to.be.not.null
            const jan = await friendCollection.findOne({ email: "jan@b.dk" })
            expect(jan.firstName).to.be.equal("Jan")
        })

        it("It should not add a user with a role (validation fails)", async () => {
            const newFriend = { firstName: "Jan", lastName: "Olsen", email: "jan@b.dk", password: "secret", role: "admin" }
            try {
                await facade.addFriend(newFriend)
                expect(false).to.be.true("Should never get to this point")
            } catch (err) {
                expect(err instanceof ApiError).to.be.true
            }
        })
    })

    describe("Verify the editFriend method", () => {
        it("It should change lastName to XXXX", async () => {
            const hashedPW = await bcryptjs.hash("secret", 4)
            const user = { firstName: "Donald", lastName: "XXXX", email: "dd@b.dk", password: "secret"}
            await facade.editFriend("dd@b.dk", user)

            const res = await friendCollection.findOne({email: "dd@b.dk"})
            expect(res.lastName).to.be.equal("XXXX")
        })
    })

    describe("Verify the deleteFriend method", () => {
        it("It should remove the user Peter", async () => {
            const status = await facade.deleteFriend("hh@hh.dk")
            expect(status).to.be.true
            const test = await friendCollection.findOne({email: "hh@hh.dk"})
            expect(test).to.be.null
        })
        it("It should return false, for a user that does not exist", async () => {
            const status = await facade.deleteFriend("IDK@hh.dk")
            expect(status).to.be.false
        })
    })

    describe("Verify the getAllFriends method", () => {
        it("It should get two friends", async () => {
            const friends = await facade.getAllFriends()
            expect(friends.length).to.be.equal(4)
        })
    })

    describe("Verify the getFriend method", () => {

        it("It should find Donald Duck", async () => {
            const friend = await facade.getFrind("dd@b.dk")
            expect(friend.firstName).to.be.equal("Donald")
            expect(friend.lastName).to.be.equal("Duck")
        })
        it("It should not find xxx.@.b.dk", async () => {
            const friend = await facade.getFrind("xxx.@.b.dk")
            expect(friend).to.be.null
        })
    })

    describe("Verify the getVerifiedUser method", () => {
        it("It should correctly validate Jens Jenssen's credential,s", async () => {
            const veriefiedPeter = await facade.getVerifiedUser("jj@j.dk", "secret")
            expect(veriefiedPeter).to.be.not.null;
        })

        it("It should NOT validate Jens Jenssen's credential,s", async () => {
            const veriefiedPeter = await facade.getVerifiedUser("jj@j.dk", "idkXD")
            expect(veriefiedPeter).to.be.null;
        })

        it("It should NOT validate a non-existing users credentials", async () => {
            const veriefiedPeter = await facade.getVerifiedUser("idk@j.dk", "secret")
            expect(veriefiedPeter).to.be.null;
        })
    })

})