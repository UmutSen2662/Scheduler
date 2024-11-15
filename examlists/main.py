from supabase import create_client, Client
from datetime import datetime
import csv, os, sys


def update_exams(file_path):
    supabase: Client = create_client(
        "https://gpprfxmjjjowyuqgvwzr.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwcHJmeG1qampvd3l1cWd2d3pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4NDU0NTQsImV4cCI6MjA0NjQyMTQ1NH0.e_RwbQVTsd4ggnH79bcX8gWL8o61pZ_wan5ypQjB77Q",
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
                        "start_time": datetime.strptime(row[1] + " " + row[2][:5], "%Y-%m-%d %A %H:%M").isoformat(),
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
                        "start_time": datetime.strptime(row[1], "%Y-%m-%d %A %H:%M").isoformat(),
                        "classrooms": row[3],
                        "is_final": False,
                    }
                )

        print("Updating exams...")
        supabase.table("exams").insert(exams).execute()
        print("Exams updated")


if __name__ == "__main__":
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    while file_path == None:
        file_path = input("Enter path to csv file: ")
        if not os.path.exists(file_path):
            print(f"File at path {file_path} does not exist\n")
            file_path = None
    update_exams(file_path)
