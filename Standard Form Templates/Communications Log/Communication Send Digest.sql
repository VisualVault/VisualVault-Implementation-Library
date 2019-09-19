SELECT *
FROM [Communications Log]
WHERE [Communication Type] = 'Email' AND
              [Scheduled Date] < GetDate() AND
              [Approved] = 'Yes' AND
              [Communication Sent] <> 'Yes' AND
              [Email Type] = 'Digest'
ORDER BY [Email Recipients], [Subject]
