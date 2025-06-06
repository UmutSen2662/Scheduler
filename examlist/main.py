from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime
import csv, os, sys


def update_exams(file_path):
    load_dotenv()
    supabase: Client = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_KEY"],
    )

    with open(file_path, "r", encoding="utf-8") as file:
        csv_reader = csv.reader(file)
        next(csv_reader)  # skip header
        exams = []

        if "final" in file_path.lower():
            supabase.table("exams").delete().eq("is_final", True).execute()
            for row in csv_reader:
                exams.append(
                    {
                        "course_exam": row[0],
                        "start_time": datetime.strptime(
                            row[1] + " " + row[2][:5], "%Y-%m-%d %A %H:%M"
                        ).isoformat(),
                        "classrooms": row[3],
                        "is_final": True,
                    }
                )
        else:
            supabase.table("exams").delete().eq("is_final", False).execute()
            for row in csv_reader:
                exams.append(
                    {
                        "course_exam": row[0],
                        "start_time": datetime.strptime(
                            row[1], "%Y-%m-%d %A %H:%M"
                        ).isoformat(),
                        "classrooms": row[3],
                        "is_final": False,
                    }
                )

        print("Updating exams...")
        response = supabase.table("exams").insert(exams).execute()
        if response.data:
            print("Exams updated")
            # Generate new timestamp (ISO 8601 format)
            new_timestamp = datetime.now().isoformat()

            # Update last_updated timestamp in metadata table
            update_response = (
                supabase.table("exams_update_date")
                .update({"last_updated": new_timestamp})
                .eq("id", 1)
                .execute()
            )

            if update_response.data:
                print("Date updated successfully:", new_timestamp)
            else:
                print("Failed to update date")
        else:
            print("Insert failed or returned no data")


if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    if file_path == None:
        file_path = input("Enter path to csv file: ").strip('"')

    if not os.path.exists(file_path):
        print(f"File at path {file_path} does not exist\n")
        sys.exit(1)
    update_exams(file_path)
