<script>
    import { supabase, userid } from "../../supabase.svelte";
    import { modals, schedule } from "../../store.svelte";

    let color = $state("");
    let name = $state("");
    let section = $state("");
    let room = $state("");
    let dialog = $state();

    $effect(() => {
        if (modals.cellModalId == "") {
            dialog.close();
            return;
        }
        dialog.showModal();

        const id = modals.cellModalId.slice(1, 3);
        name = "";
        section = "";
        room = "";
        color = "";
        schedule.schedule.forEach((c) => {
            if (c.row.toString(16) == id[0] && c.col.toString(16) == id[1]) {
                name = c.name;
                section = c.section;
                room = c.room;
                color = c.color;
            }
        });
    });

    $effect(() => {
        name = name.toUpperCase();
        section = section.toUpperCase();
        room = room.toUpperCase();
    });

    $effect(() => {
        const colors = document.getElementsByClassName("colorBtn");
        for (let i = 0; i < colors.length; i++) {
            colors[i].classList.remove("selected");
            // @ts-ignore
            if (colors[i].style.backgroundColor == color) {
                colors[i].classList.add("selected");
            }
        }
    });

    $effect(() => {
        localStorage.setItem("schedule", JSON.stringify(schedule.schedule));
    });

    async function modalSave() {
        const id = modals.cellModalId.slice(1, 3);
        if (userid) {
            const { error } = await supabase.from("course").upsert({
                userid: userid,
                name: name,
                section: section,
                room: room,
                color: color,
                row: parseInt(id[0], 16),
                col: parseInt(id[1], 16),
            });
            if (error) console.log(error);
        }

        let found = false;
        schedule.schedule.forEach((c) => {
            if (c.col == parseInt(id[1], 16) && c.row == parseInt(id[0], 16)) {
                c.name = name;
                c.section = section;
                c.room = room;
                c.color = color;
                found = true;
            }
        });

        if (!found) {
            schedule.schedule.push({
                name: name,
                section: section,
                room: room,
                color: color,
                row: parseInt(id[0], 16),
                col: parseInt(id[1], 16),
            });
        }

        dialog.close();
    }

    async function modalDelete() {
        const id = modals.cellModalId.slice(1, 3);
        if (userid) {
            const { error } = await supabase
                .from("course")
                .delete()
                .eq("userid", userid)
                .eq("row", parseInt(id[0], 16))
                .eq("col", parseInt(id[1], 16));
            if (error) console.log(error);
        }

        schedule.schedule = schedule.schedule.filter(
            (c) => c.col != parseInt(id[1], 16) || c.row != parseInt(id[0], 16)
        );

        dialog.close();
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
    bind:this={dialog}
    onclose={() => (modals.cellModalId = "")}
    onclick={(e) => {
        if (e.target === dialog) dialog.close();
    }}
>
    <div class="modal">
        <div class="inside">
            <input type="text" list="courseCodes" bind:value={name} placeholder="Name" />
            <input type="text" list="sections" bind:value={section} placeholder="Section" />
            <input type="text" list="classrooms" bind:value={room} placeholder="Room" />
        </div>
        <div class="color">
            {#each ["rgb(240, 240, 240)", "rgb(255, 42, 42)", "rgb(255, 149, 21)", "rgb(255, 255, 0)", "rgb(182, 255, 0)", "rgb(0, 176, 32)", "rgb(0, 255, 192)", "rgb(64, 208, 255)", "rgb(48, 128, 255)", "rgb(151, 82, 203)"] as bColor}
                <!-- svelte-ignore a11y_consider_explicit_label -->
                <button
                    class="colorBtn {color == bColor ? 'selected' : ''}"
                    style="background: {bColor}"
                    onclick={() => (color = bColor)}
                ></button>
            {/each}
        </div>
        <div class="buttons">
            <button style="margin-right: auto; color: var(--red)" onclick={modalDelete}
                >Delete</button
            >
            <button style="margin-right: 0.4rem" onclick={modalSave}>Save</button>
            <button style="color: var(--acccent)" onclick={() => dialog.close()}>Cancel</button>
        </div>
    </div>
</dialog>

<style>
    .modal {
        padding: 1rem;
    }

    .inside {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .inside input {
        padding: 0.4rem;
    }

    .color {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 0.5rem;
        margin: 1rem 0;
    }

    .colorBtn {
        border: var(--borderSize) solid #000;
        height: 2rem;
        outline: none;
    }
    .colorBtn:hover,
    .colorBtn:focus {
        border: calc(var(--borderSize) * 2) dashed rgba(32, 32, 32, 0.6);
    }
    .colorBtn:active,
    .color .selected {
        border: calc(var(--borderSize) * 2) dashed #000;
    }
    .colorBtn:hover::before,
    .colorBtn:focus::before,
    .colorBtn:active::before {
        background: rgba(0, 0, 0, 0);
    }

    .buttons {
        display: flex;
    }
    .buttons button {
        width: 4rem;
    }
</style>
