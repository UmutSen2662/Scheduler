import { createClient } from "@supabase/supabase-js";
import isOnline from "is-online";

export const online = await isOnline();

export const supabase = online
    ? createClient(
          "https://gpprfxmjjjowyuqgvwzr.supabase.co",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcHJmeG1qampvd3l1cWd2d3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NDU0NTQsImV4cCI6MjA0NjQyMTQ1NH0.e_RwbQVTsd4ggnH79bcX8gWL8o61pZ_wan5ypQjB77Q"
      )
    : null;

export const userid = online ? await checkSession() : null;

// Check if a user is signed in
async function checkSession() {
    if (!online) return null;

    const { data, error } = await supabase.auth.getUser();

    if (!error) return data.user.id;
    return null;
}

export async function signOut() {
    if (!online) return null;

    const { error } = await supabase.auth.signOut();
    if (error) alert("Error signing out: " + error.message);
    else window.location.reload();
}

export async function signIn(email, password) {
    if (!online) return null;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    if (error) alert("Error signing in: " + error.message);
    else window.location.reload();
}

export async function signUp(email, password) {
    if (!online) return null;

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    if (error) alert("Error signing up: " + error.message);
    else window.location.reload();
}

export async function getExamList() {
    if (online) {
        const { data: data } = await supabase
            .from("exams")
            .select("course_exam, start_time, classrooms")
            .order("start_time", { ascending: true });
        if (data) {
            localStorage.setItem("exams", JSON.stringify(data));
            return data;
        }
    }
    return JSON.parse(localStorage.getItem("exams"));
}

export async function getCourseCodes() {
    if (!online) return null;

    const { data: data } = await supabase.from("course_codes").select("courses");
    if (data)
        if (data.length > 0) {
            const str = data[0].courses;
            localStorage.setItem("course_codes", str);

            if (str != "") {
                return data[0].courses;
            }
        }
    return "";
}

export async function updateCourseCodes(set) {
    if (!online) return null;

    const str = Array.from(set).join(",");
    if (userid) {
        const { error } = await supabase.from("course_codes").upsert({ userid: userid, courses: str });
        if (error) {
            console.error(error);
        }
    }
}

export async function getOptions() {
    if (!online) return null;

    const { data: data } = await supabase.from("options").select("*");
    if (data)
        if (data.length > 0) {
            return data[0];
        }
    return null;
}

export async function updateOptions(options) {
    if (!online) return null;

    if (userid) {
        const { error } = await supabase
            .from("options")
            .upsert({ userid: userid, time: options.time, rows: options.rows });
        if (error) {
            console.error(error);
        }
    }
}

export async function getSchedule() {
    if (!online) return null;

    const { data: course } = await supabase.from("course").select("*");
    if (course)
        if (course.length > 0) {
            const mapped = course.map((c) => ({
                name: c.name,
                section: c.section,
                room: c.room,
                color: String(c.color),
                row: c.row,
                col: c.col,
            }));
            return mapped;
        }
    return null;
}

export async function getLastUpdate() {
    if (online) {
        const { data } = await supabase.from("exams_update_date").select("last_updated").eq("id", 1).single();
        const lastUpdated = new Date(data.last_updated);
        return lastUpdated.getTime();
    }
    return 1741703246690;
}

export async function updateExams(data) {
    if (online) {
        const isFinal = data.slice(0, 20).includes("Date");

        const deleteResponse = await supabase.from("exams").delete().eq("is_final", isFinal);
        if (deleteResponse.error) {
            console.error("Error deleting old exams:", deleteResponse.error.message);
            return;
        }

        const examlist = parseExamData(data, isFinal);
        const insertResponse = await supabase.from("exams").insert(examlist);
        if (insertResponse.error) {
            console.error("Failed to insert exams:", insertResponse.error.message);
            return;
        }

        const { error } = await supabase.from("exams_update_date").upsert({ id: 1, last_updated: new Date() });
        if (error) console.log(error);
    }
}

function parseExamData(data, isFinal) {
    const rows = data.split("\n").slice(1);
    const parsed = [];

    if (isFinal) {
        for (const row of rows) {
            const columns = row.split("\t");
            parsed.push({
                course_exam: columns[0],
                start_time: columns[1].split(" ")[0] + "T" + columns[2].slice(0, 5) + ":00",
                classrooms: columns[3],
                is_final: true,
            });
        }
    } else {
        for (const row of rows) {
            const columns = row.split("\t");
            let time = columns[1].split(" ");
            parsed.push({
                course_exam: columns[0],
                start_time: time[0] + "T" + time[2] + ":00",
                classrooms: columns[3],
                is_final: false,
            });
        }
    }
    console.log(parsed);

    return parsed;
}
